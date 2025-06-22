import { Request, Response } from "express";

export async function TestController(req: Request, res: Response) {
    return res.status(200).json({ message: "Test" })
}