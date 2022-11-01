import User, { TokenSet } from '../../../models/user/user.js'

interface CreateUserParams {
  user?: User
  admin?: boolean
}

const getTokens = async (params?: CreateUserParams): Promise<TokenSet> => {
  const data = params?.admin === true ? { name: 'Admin', admin: true } : undefined
  const user = params?.user ?? new User(data)

  await user.save()
  const tokens = await user.generateTokens()
  await user.save()

  return tokens
}

export default getTokens
