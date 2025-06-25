import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { redis } from "../config/redis";

interface JwtPayload {
    id: string;
    name: string;
    role: string;
    iat: number;
    exp: number;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized: No token provided" });
        return;
    }

    const token = authHeader.split(" ")[1];

    try {
        const isBlacklisted = await redis.get(`bl_${token}`);
        if (isBlacklisted) {
            res.status(401).json({ message: "Unauthorized: Token is blacklisted" });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        req.user = decoded;
        next();
    } catch (err: any) {
        console.error("JWT verify error:", err.message);
        res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
}

export function authorize(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = req.user;
        if (!user || !allowedRoles.includes(user.role)) {
            res.status(403).json({ message: "Forbidden: Access denied" });
            return;
        }
        next();
    };
}
