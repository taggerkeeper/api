import mongoose, { Model } from 'mongoose'
import UserData from './data.js'
import pickRandomElem from '../../utils/pick-random-elem.js'

const { Schema, model } = mongoose

interface IUserModel extends Model<UserData> {
  generateRandomName: () => string
}

const generateRandomName = (): string => {
  const anonymousAnimals = ['Aardvark', 'Akita', 'Albatross', 'Anteater', 'Antelope', 'Ape', 'Armadillo', 'Awk',
    'Axolotl', 'Baboon', 'Badger', 'Bear', 'Bison', 'Boar', 'Cheetah', 'Cobra', 'Coelacanth', 'Coyote', 'Crab', 'Crane',
    'Crocodile', 'Crow', 'Dingo', 'Eagle', 'Emu', 'Ermine', 'Falcon', 'Ferret', 'Fox', 'Frog', 'Gecko', 'Gibbon',
    'Gopher', 'Greyhound', 'Haddock', 'Heron', 'Hippo', 'Hyena', 'Ibis', 'Impala', 'Jackal', 'Jaguar', 'Lemur', 'Lizard',
    'Llama', 'Lobster', 'Lynx', 'Macaque', 'Macaw', 'Mallard', 'Mandrill', 'Mantis', 'Mastiff', 'Meerkat', 'Mongoose',
    'Monkey', 'Muskrat', 'Newt', 'Nightingale', 'Ocelot', 'Octopus', 'Pangolin', 'Panther', 'Parrot', 'Pelican',
    'Penguin', 'Pirana', 'Platypus', 'Porpoise', 'Puffin', 'Puma', 'Python', 'Raven', 'Rhino', 'Robin', 'Sable',
    'Salamander', 'Sawfish', 'Scorpion', 'Serpent', 'Shark', 'Sloth', 'Snake', 'Sparrow', 'Spider', 'Starfish',
    'Stingray', 'Swan', 'Tapir', 'Tarsier', 'Tiger', 'Toad', 'Toucan', 'Vulture', 'Whippet', 'Wildebeest', 'Wolf',
    'Wombat', 'Zebra', 'Zebu']
  const animal = pickRandomElem(anonymousAnimals) as string
  return `Anonymous ${animal}`
}

const schema = new Schema<UserData>({
  name: { type: String, required: true, default: generateRandomName() },
  active: { type: Boolean, default: true },
  admin: { type: Boolean, default: false },
  password: String,
  refresh: String,
  emails: [
    {
      addr: String,
      verified: Boolean,
      code: String
    }
  ],
  otp: {
    enabled: {
      type: Boolean,
      default: false,
      validate: {
        validator: function (val: boolean) {
          return !val || (this as any).otp.secret !== undefined
        },
        message: () => 'You must have a secret before you can enable OTP.'
      }
    },
    secret: { type: String }
  }
})

schema.statics.generateRandomName = function () {
  return generateRandomName()
}

const UserModel = model<UserData, IUserModel>('User', schema)

export default UserModel
