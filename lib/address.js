
import bsv from 'bsv'
import assert from 'assert'
const Random = bsv.crypto.Random
import { Uint64LE } from 'int64-buffer'

// 地址生成目的
const TARGET = {
  WALLET: 0,
  CHANGE: 1,
  NOTE: 2
}

// 生成观察用地址的script
const mapAddressToScriptHash = ( address ) => {
  // 从地址获取P2PKH， 这是一个加锁脚本，如果在节点输出中发现这个脚本，那么会通知钱包
  const bsvAddress = bsv.Address.fromString( address )
  const script = bsv.Script.fromAddress( bsvAddress )
  // 获取ASM脚本
  // OP_DUP OP_HASH160 2d71a93e40de14da35e1c514bc917869de3cbc6e OP_EQUALVERIFY OP_CHECKSIG
  // // const addressScritASM = script.toASM()
  // console.log( addressScritASM )
  // address has P2PKH script
  const addressScritHex = script.toHex()
  // console.log( addressScritHex )
  // with SHA256 hash:
  const hash256 = bsv.crypto.Hash.sha256( script.toBuffer() )
  // console.log( hash256.toString( 'hex' ) )
  // which is sent to the server reversed as:
  const reversedHash256 = hash256.reverse()
  const reversedHash256Hex = reversedHash256.toString( 'hex' )
  // console.log( reversedHash256Hex )
  return { scriptHex: addressScritHex, scriptHash: reversedHash256Hex }
}

// 从根路径生成一个指定索引的地址
// target 0:钱包地址， 1:固定找零地址， 2:设置为note目的
// index是派生路径索引
const generateAddress = (rootHDPrivateKey, extPath, index ) => {
  assert.ok(rootHDPrivateKey)

  // 使用根目录私钥做派生
  const hdChildMB = rootHDPrivateKey.deriveChild( extPath )
  // 获取地址
  const childAddress = bsv.Address.fromPublicKey( hdChildMB.publicKey )
  // console.log( extPath, childAddress.toString() )
  // 返回公钥，私钥和地址
  const { scriptHex, scriptHash } = mapAddressToScriptHash( childAddress.toString() )
  const result = {
    index: index, // 生成的地址编号
    extPath: extPath,
    hdChildMB: hdChildMB, // hd子私钥
    addressString: childAddress.toString(), // 对应的地址
    publicKey: hdChildMB.publicKey, // 对应的公钥
    privateKey: hdChildMB.privateKey, // 对应的私钥
    scriptHex: scriptHex,
    scriptHash: scriptHash
  }

  return result
}

// 返回一个新笔记ID，这个ID应该是没有用过的，每次新生成的所以在秒单位比先生成id更大
const newId = () => {
  // 使用协议算法， 不再查询数据库
  const GenesisDate = new Date('2020-02-04 01:55:30 utc')
  const genesisTime = Date.now() - GenesisDate.getTime() // 创世时间
  const newId = Math.floor((genesisTime + Math.random()) * 100) // 索引
  return newId
}

// 返回一个新的地址，这个地址索引在0到2**53之间随机生成
const newAddressIndex = () => {
  // const Hardened = 0x80000000
  // const limit = (Hardened - 1) ** 2
  // IEEE-754 could only handle 53 bits precision
  const limit = Math.pow(2, 53) - 2// Number.MAX_SAFE_INTEGER是Math.pow(2, 53)-1
  // 生成64位的随机数
  const buf = Random.getRandomBuffer(8)
  const randNum = Uint64LE(buf)
  // 将索引限制在范围内, Javascript最多只能显示53 bits，超过的话后面都是补0，所以限制在53bits范围内的随机数
  const newIndex = (randNum % limit) + 1 // between 1 and 2^53-1
  return newIndex
}

// 生成钱包地址
const generateWalletAddress = (rootHDPrivateKey, index) => {
  // 钱包地址符合BIP44规范
  const extPath = `m/${TARGET.WALLET}/${index}`
  return generateAddress( rootHDPrivateKey, extPath, index)
}

// 生成Note地址
const generateNoteAddress = (rootHDPrivateKey, index) => {
  // NOTE地址使用协议算法
  const Hardened = 0x80000000
  const quotient = Math.floor(index / Hardened)
  const remainder = index % Hardened
  const extPath = `m/${TARGET.NOTE}/${quotient}/${remainder}`
  return generateAddress( rootHDPrivateKey, extPath, index)
}

// 将地址的公钥Hash转换为base64的格式，用于Bitsocket
const address2HashBase64 = (address, network = 'livenet') => bsv.Address.fromString(address, network).hashBuffer.toString('base64')

export {
  newId,
  mapAddressToScriptHash,
  generateAddress,
  newAddressIndex,
  generateWalletAddress,
  generateNoteAddress,
  address2HashBase64
}
