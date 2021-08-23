const XLSX = require('xlsx')

class ExcelReader {
    // TODO refactor row.A/.B ... etc
    constructor(cfg = undefined) {
        this.cfg = cfg || {}
        this.hasChipIndex = false
        this.root = {
            headpage: 'root',
            prefix: '',
            pprange: '',
            name: 'root',
            id: `root_${this.createID()}`,
            data_mux_file: [],
            memory_block: [],
            revisions: [],
            children: []
        }
    }

    createTree(data, cfg) {
        this.readData(data, cfg)
        this.getChildren()
        this.root.name = this.root.headpage
        return this.root
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
            } else if (stage === 'DATA_MUX') {
                let child = (row.B || '').trim()
                if (child.toLowerCase().startsWith('file_')) {
                    child = this.createLeaf(child)
                } else if (child.toLowerCase().startsWith('mode_')) {
                    child = this.createNode(child)
                } else {
                    throw Error(
                        `Not a valid name: ${child}, expecting string startswith 'file_' or 'mode_'`
                    )
                }
                if (child) node.children.push(child)
            } else {
                throw Error(
                    `Fatal Error: this stage "${stage}" should not exist.`
                )
            }
        })
        node.id = `${node.name}_${this.createID()}`
        if (node.children.length === 1) return node.children[0]
        return node
    }

    createLeaf(sheetName) {
        const sheet = this.getSheetByName(sheetName)
        if (!sheet) return undefined

        const is_node = (sheet[0].A || '').trim().toUpperCase() === 'DATA_MUX'
        if (is_node) {
            // TODO: should raise Error here?
            // you expecting a leaf, but got a parent instead
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
        let baseAddr = 0
        const addressWidth = Math.ceil((this.cfg.addressWidth || 32) / 4)
        // let slice_cnt = 0
        // const slice = []
        sheet.forEach(row => {
            if (wait) {
                // to skip header
                wait--
                return
            }
            const $rowIndex = (row.A || '').trim().toLowerCase()
            if (stage === 'attribute') {
                if (leaf.hasOwnProperty($rowIndex)) leaf[$rowIndex] = row.B || ''
                if ($rowIndex === 'register' || $rowIndex === "table") {
                    stage = 'REGISTER'
                    wait = 1
                }
            } else if (stage === 'REGISTER') {
                if ($rowIndex === 'register' || $rowIndex === "table") {
                    stage = 'REGISTER'
                    wait = 1
                    return
                }
                // if first column exists, then must have a new register
                if (row.A) {
                    if (row.I) {
                        // get base address by memory block
                        baseAddr = this.getBaseAddress(row.I, leaf, row)
                    } else {
                        // otherwise, using leaf.name instead
                        baseAddr = this.getBaseAddress(leaf.name, leaf, row)
                    }
                    if (leaf.baseAddress === "") {
                        leaf.baseAddress = baseAddr
                    }
                    [register, offset] = this.createRegister(row, baseAddr, offset, addressWidth)
                }
                this.registerAddField(register, row)
                // if LSB === 0 then push
                if (
                    parseInt(row.M) === 0 &&
                    register.name.toUpperCase() !== 'RESERVED'
                ) {
                    leaf.children.push(register)
                }
            } else {
                throw Error(
                    `Fatal Error: this stage "${stage}" should not exist.`
                )
            }
        })
        leaf.id = `${leaf.name}_${this.createID()}`
        return leaf
    }

    createRegister(row, baseAddr, offset, addressWidth = 8) {
        let name = row.B
        const register = {
            id: `${name}_${this.createID()}`,
            public: row.A,
            name: name,
            address: `0x${(offset + baseAddr).toString(16).padStart(addressWidth, 0)}`,
            offset: `0x${(offset).toString(16).padStart(4, 0)}`,
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

    getBaseAddress(name, leaf, row) {

        let baseAddr = "0x0"
        if (!this.hasChipIndex) {
            baseAddr = leaf.abstract || '0x0'
        } else {
            const block = this.root.memory_block.find(block => block.name === name)
            if (!block) {
                console.log(`${name} not found in memory block (${leaf.name})`)
                console.log(row)
            } else {
                baseAddr = block.baseAddress || '0x0'
            }
        }

        baseAddr = parseInt(baseAddr, 16)
        if (!baseAddr) baseAddr = 0
        return baseAddr
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
// excel.readChipIndex()
// const node = createNode('mod_SYS_REG.xml')

export default ExcelReader
