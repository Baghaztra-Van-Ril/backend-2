import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { redis } from "../config/redis";

// Disesuaikan dengan payload JWT kamu
interface JwtPayload {
    id: number;
    email: string;
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

// Helper untuk ambil token dari header atau cookie
function extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    const tokenFromCookie =
        req.cookies?.token ||
        req.cookies?.authToken ||
        req.cookies?.accessToken ||
        req.cookies?.jwt ||
        null;
    return tokenFromHeader || tokenFromCookie;
    
}

// Middleware: Untuk user & guest (optional auth)
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = extractToken(req);

    if (!token) {
        console.log("Access as: GUEST");
        req.user = undefined;
        return next();
    }

    try {
        const isBlacklisted = await redis.get(`bl_${token}`);
        if (isBlacklisted) {
            console.log("Access as: GUEST (token blacklisted)");
            req.user = undefined;
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        req.user = decoded;
        console.log(`Access as: ${decoded.role} (user ID: ${decoded.id}, email: ${decoded.email})`);
        return next();
    } catch {
        console.log("Access as: GUEST (invalid token)");
        req.user = undefined;
        return next();
    }
}

// Middleware: Hanya untuk user yang login (wajib token valid)
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = extractToken(req);

    if (!token) {
        console.log("Access denied: No token provided");
        res.status(401).json({
            success: false,
            message: "Unauthorized: No token provided",
        });
        return;
    }

    try {
        const isBlacklisted = await redis.get(`bl_${token}`);
        if (isBlacklisted) {
            console.log("Access denied: Token blacklisted");
            res.status(401).json({
                success: false,
                message: "Unauthorized: Token is blacklisted",
            });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        req.user = decoded;
        console.log(`Authenticated as: ${decoded.role} (user ID: ${decoded.id}, email: ${decoded.email})`);
        return next();
    } catch {
        console.log("Access denied: Invalid token");
        res.status(401).json({
            success: false,
            message: "Unauthorized: Invalid token",
        });
        return;
    }
}

// Middleware: Role-based access control
export function authorize(...allowedRoles: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = req.user;

        if (!user || !allowedRoles.includes(user.role)) {
            console.log(`Authorization failed: Role '${user?.role || "none"}' not allowed [${allowedRoles.join(", ")}]`);
            res.status(403).json({
                success: false,
                message: "Forbidden: Access denied",
            });
            return;
        }

        console.log(`Authorization success: Role '${user.role}' granted`);
        return next();
    };
}
