import config from '../config'
const console = config.console

// 对称加密算法
// https://github.com/ricmoo/aes-js
const aesjs = require( 'aes-js' )
// 浏览器用密码派生库
const scrypt = require( 'scrypt-js' )

// Buffer库，用于浏览器 https://github.com/feross/buffer
const Buffer = require( 'buffer/' ).Buffer
// 随机字节发生器，用于生成salt
const randomBytes = require( 'randombytes' )

// 为什么要加盐，可以参考 https://lichao.dev/2013/07/05/password-salt
// 每个salt需要保存在相应的字段里，在解密的时候使用
// salt是一个随机数字，结合password使用scrypt或者类似的算法，生成key，
// scrypt进行次数非常多的计算，用来消耗黑客攻击的可能性，因为每对撞生一个key都需要花费时间，让黑客消耗更多的时间
function salt () {
  return randomBytes( 16 ).toString( 'hex' )
}

const ModeOfOperationCTR = aesjs.ModeOfOperation.ctr

// https://zh.wikipedia.org/wiki/%E5%88%86%E7%BB%84%E5%AF%86%E7%A0%81%E5%B7%A5%E4%BD%9C%E6%A8%A1%E5%BC%8F
// CTR是AES算法的一种
// 从密码和salt一起生成一个key，使用这个key来加密和解密
async function generateKey ( password, salt ) {
  const passwordBuffer = Buffer.alloc( password.length, password )
  const saltBuffer = Buffer.alloc( salt.length, salt )

  const N = 1024, r = 8, p = 1
  const dkLen = 32
  // Async
  const pbkdy = await scrypt.scrypt( passwordBuffer, saltBuffer, N, r, p, dkLen )

  return pbkdy
}

// 使用aes ctr算法加密
function encrypt ( key, text ) {
  const textBytes = aesjs.utils.utf8.toBytes( text )

  console.log( key )
  // The counter is optional, and if omitted will begin at 1
  const aesCtr = new ModeOfOperationCTR( key, new aesjs.Counter( 5 ) )
  const encryptedBytes = aesCtr.encrypt( textBytes )

  // To print or store the binary data, you may convert it to hex
  const encryptedHex = aesjs.utils.hex.fromBytes( encryptedBytes )
  console.log( encryptedHex )
  // "a338eda3874ed884b6199150d36f49988c90f5c47fe7792b0cf8c7f77eeffd87
  //  ea145b73e82aefcf2076f881c88879e4e25b1d7b24ba2788"
  return encryptedHex
}
// 使用aes ctr算法解密
function decrypt ( key, encryptedHex ) {
  // When ready to decrypt the hex string, convert it back to bytes
  const encryptedBytes = aesjs.utils.hex.toBytes( encryptedHex )

  // The counter mode of operation maintains internal state, so to
  // decrypt a new instance must be instantiated.
  const aesCtr = new ModeOfOperationCTR( key, new aesjs.Counter( 5 ) )
  const decryptedBytes = aesCtr.decrypt( encryptedBytes )

  // Convert our bytes back into text
  const decryptedText = aesjs.utils.utf8.fromBytes( decryptedBytes )
  console.log( decryptedText )
  return decryptedText
}

export default {
  salt,
  generateKey,
  encrypt,
  decrypt
}
