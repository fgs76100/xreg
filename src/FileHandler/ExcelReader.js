const XLSX = require('xlsx')

class ExcelReader {
    // TODO refactor row.A/.B ... etc
    constructor(cfg = undefined) {
        this.cfg = cfg || {}
        this.hasChipIndex = false
        this.root = {
            headpage: '',
            prefix: '',
            pprange: '',
            name: '',
            id: `root_${this.createID()}`,
            data_mux_file: [],
            memory_block: [],
            revisions: [],
            children: []
        }
    }

    readFile(filename) {
        this.wb = XLSX.readFile(filename)
        this.hasChipIndex = this.wb.SheetNames.includes('chip_index')
    }

    readData(data, cfg) {
        this.wb = XLSX.read(data, cfg)
    }

    getChildren() {
        this.hasChipIndex = this.wb.SheetNames.includes('chip_index')
        if (this.hasChipIndex) this.readChipIndex()
        const sheeNames = this.hasChipIndex
            ? this.root.data_mux_file
            : this.wb.SheetNames.filter(sheetName =>
                sheetName.toLowerCase().startsWith('mod_')
            )
        sheeNames.forEach(sheetName => {
            this.root.children.push(this.createNode(sheetName))
        })
    }

    getSheetByName(sheetName) {
        sheetName = sheetName.trim().replace('.xml', '')
        if (!this.wb.SheetNames.includes(sheetName)) {
            throw Error(`SheetNotFoundError: No such sheet name exist: "${sheetName}"`)
        }
        return XLSX.utils.sheet_to_json(this.wb.Sheets[sheetName], {
            header: 'A'
        })
    }

    readChipIndex() {
        const chip_index = this.getSheetByName('chip_index')
        let stage = 'attribute'
        let wait = 1

        chip_index.forEach(row => {
            const $rowIndex = (row.A || '').trim().toLowerCase()

            if (stage === 'attribute') {
                if ($rowIndex === 'data_mux_file') {
                    stage = 'DATA_MUX_FILE'
                    return
                }
                // get project attribute
                if (this.root.hasOwnProperty($rowIndex)) this.root[$rowIndex] = row.B
                //
            } else if (stage === 'DATA_MUX_FILE') {
                row.B = (row.B || '').trim()
                if ($rowIndex === 'memory_block') {
                    stage = 'MEMORY_BLOCK'
                    wait = 1
                    return
                }
                if (row.B.endsWith('.xml')) {
                    this.root.data_mux_file.push(row.B)
                }
            } else if (stage === 'MEMORY_BLOCK') {
                if ($rowIndex === 'history') {
                    stage = 'Revisions'
                    wait = 1
                    return
                }
                if (wait) {
                    // to skip header
                    wait--
                    return
                }
                // get memory blocks
                this.root.memory_block.push({
                    name: row.A,
                    baseAddress: row.B,
                    number: row.C,
                    desc: row.D,
                    belongTo: row.E
                })
            } else if (stage === 'Revisions') {
                if (wait) {
                    // to skip header
                    wait--
                    return
                }
                this.root.revisions.push({
                    public: row.A,
                    version: row.B,
                    date: row.C,
                    desc: row.D,
                    author: row.E
                })
            }
        })
    }

    createNode(sheetName) {
        const sheet = this.getSheetByName(sheetName)
        if (!sheet) return undefined

        const is_leaf = (sheet[0].A || '').trim().toUpperCase() === 'FILE'
        if (is_leaf) {
            return this.createLeaf(sheetName)
        }

        const is_node = (sheet[0].A || '').trim().toUpperCase() === 'DATA_MUX'
        if (!is_node) {
            throw Error(`TypeError: Cannot detect this node [${sheet[0].A}]: ${sheetName}`)
        }

        const node = {
            name: '',
            desc: '',
            regnum: '',
            author: '',
            date: '',
            version: '',
            abstract: '',
            history: '',
            // id: this.createID(),
            children: []
        }
        let stage = 'attribute'
        sheet.forEach(row => {
            const $rowIndex = (row.A || '').trim().toLowerCase()
            if (stage === 'attribute') {
                if (node.hasOwnProperty($rowIndex)) node[$rowIndex] = row.B || ''
                if ($rowIndex === 'reg_file') {
                    stage = 'DATA_MUX'
                }
            } else {
                let child = (row.B || '').trim()
                if (child.toLowerCase().startsWith('file_')) {
                    child = this.createLeaf(child)
                } else if (child.toLowerCase().startsWith('mode_')) {
                    child = this.createNode(child)
                } else {
                    child = undefined
                }
                if (child) node.children.push(child)
            }
        })
        node.id = `${node.name}_${this.createID()}`
        return node
    }

    createLeaf(sheetName) {
        const sheet = this.getSheetByName(sheetName)
        if (!sheet) return undefined

        const is_node = (sheet[0].A || '').trim().toUpperCase() === 'DATA_MUX'
        if (is_node) {
            return this.createNode(sheetName)
        }

        const is_leaf = (sheet[0].A || '').trim().toUpperCase() === 'FILE'
        if (!is_leaf) {
            throw Error(`TypeError: Cannot detect this node [${sheet[0].A}]: ${sheetName}`)
        }

        const leaf = {
            name: '',
            public: '',
            desc: '',
            comment: '',
            regnum: '',
            author: '',
            date: '',
            version: '',
            abstract: '',
            history: '',
            baseAddress: '',
            // id: this.createID(),
            children: []
        }

        let stage = 'attribute'
        let register = undefined
        let offset = 0
        let wait = 1
        const addressWidth = Math.ceil((this.cfg.addressWidth || 32) / 4)
        // let slice_cnt = 0
        // const slice = []
        sheet.forEach(row => {
            const $rowIndex = (row.A || '').trim().toLowerCase()
            if (stage === 'attribute') {
                if (leaf.hasOwnProperty($rowIndex)) leaf[$rowIndex] = row.B || ''
                if ($rowIndex === 'register') {
                    stage = 'REGISTER'
                    offset = this.hasChipIndex
                        ? this.getBaseAddress(leaf.name)
                        : leaf.abstract || '0x0'
                    leaf.baseAddress = offset
                    offset = parseInt(offset, 16)
                    if (!offset) offset = 0
                    wait = 1
                }
            } else {
                if (wait) {
                    // to skip header
                    wait--
                    return
                }
                // if first column exists, then must have a new register
                if (row.A)
                    [register, offset] = this.createRegister(row, offset, addressWidth)
                this.registerAddField(register, row)
                // if LSB === 0 then push
                if (
                    parseInt(row.M) === 0 &&
                    register.name.toUpperCase() !== 'RESERVED'
                ) {
                    leaf.children.push(register)
                }
            }
        })
        leaf.id = `${leaf.name}_${this.createID()}`
        return leaf
    }

    createRegister(row, offset, addressWidth = 8) {
        let name = row.B
        const register = {
            id: `${name}_${this.createID()}`,
            public: row.A,
            name: name,
            address: `0x${offset.toString(16).padStart(addressWidth, 0)}`,
            desc: row.J,
            fields: []
        }
        offset += (parseInt(row.H || 32) * (parseInt(row.G || 0) + 1)) / 8
        return [register, offset]
    }

    registerAddField(register, row) {
        let name = row.N
        register.fields.push({
            id: `${name}_${this.createID()}`,
            public: row.K,
            // MSB: row.L,
            // LSB: row.M,
            bits: `${row.L}:${row.M}`,
            field: name,
            access: row.Q,
            default: row.R,
            // testable: row.W || true,
            desc: row.P
        })
    }

    getBaseAddress(leafName) {
        const block = this.root.memory_block.find(block => block.name === leafName)
        if (!block) {
            return '0x0'
        } else {
            return block.baseAddress || '0x0'
        }
    }

    createID() {
        // source https://gist.github.com/gordonbrander/2230317
        return Math.random()
            .toString(36)
            .substr(2, 9)
    }
} // end of class

// const excel = new ExcelBase()
// excel.readFile('RLE0947_SoC_RegisterFile.xls')
// excel.getChildren()
// console.log(excel.root)
// excel.readChipIndex()
// console.log(excel.root)
// const node = createNode('mod_SYS_REG.xml')
// console.log(JSON.stringify(excel.createLeaf('file_SYS_REG.xml'), null, 2))
// console.log(excel.createLeaf('file_SYS_REG.xml'))

export default ExcelReader
