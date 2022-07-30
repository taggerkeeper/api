import PasswordResetModel from '../model.js'
import PasswordReset from '../password-reset.js'

const loadPasswordResetByEmailAndCode = async (addr: string, code: string): Promise<PasswordReset | null> => {
  const record = await PasswordResetModel.findOne({ 'email.addr': addr, code, expiration: { $lt: new Date() } }).populate('user')
  if (record === null) return null
  return PasswordReset.loadObject(record)
}

export default loadPasswordResetByEmailAndCode
