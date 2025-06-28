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
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    const tokenFromCookie = req.cookies?.token ||
        req.cookies?.authToken ||
        req.cookies?.accessToken ||
        req.cookies?.jwt ||
        null;

    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
        console.log("Access as: GUEST");
        req.user = undefined;
        next();
        return;
    }

    try {
        const isBlacklisted = await redis.get(`bl_${token}`);
        if (isBlacklisted) {
            console.log("Access as: GUEST (token blacklisted)");
            req.user = undefined;
            next();
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        console.log(`Access as: ${decoded.role} (${decoded.name})`);
        req.user = decoded;
        next();
    } catch (err: any) {
        console.log("Access as: GUEST (invalid token)");
        req.user = undefined;
        next();
    }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    const tokenFromCookie = req.cookies?.token ||
        req.cookies?.authToken ||
        req.cookies?.accessToken ||
        req.cookies?.jwt ||
        null;

    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
        console.log("Access denied: No token provided");
        res.status(401).json({
            success: false,
            message: "Unauthorized: No token provided"
        });
        return;
    }

    try {
        const isBlacklisted = await redis.get(`bl_${token}`);
        if (isBlacklisted) {
            console.log("Access denied: Token blacklisted");
            res.status(401).json({
                success: false,
                message: "Unauthorized: Token is blacklisted"
            });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        console.log(`Authenticated as: ${decoded.role} (${decoded.name})`);
        req.user = decoded;
        next();
    } catch (err: any) {
        console.log("Access denied: Invalid token");
        res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid token"
        });
    }
}

export function authorize(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = req.user;

        if (!user || !allowedRoles.includes(user.role)) {
            console.log(`Authorization failed: User role '${user?.role || 'none'}' not in allowed roles [${allowedRoles.join(', ')}]`);
            res.status(403).json({
                success: false,
                message: "Forbidden: Access denied"
            });
            return;
        }
        
        console.log(`Authorization success: ${user.role} access granted`);
        next();
    };
}