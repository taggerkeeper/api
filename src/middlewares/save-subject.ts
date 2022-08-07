import { Request, Response, NextFunction } from 'express'
import expressAsyncHandler from 'express-async-handler'

const saveSubject = async function (req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.subject !== undefined) await req.subject.save()
  } catch (err) {
    console.error(err)
  }
}

export default expressAsyncHandler(saveSubject)
