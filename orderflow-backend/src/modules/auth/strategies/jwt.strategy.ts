import * as jwt from 'jsonwebtoken';

export class JwtStrategy {
  private readonly jwtSecret: string;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET!;
  }

  createToken(userId: string, role: string): string {
    const payload = { sub: userId, role };
    const token = jwt.sign(payload, this.jwtSecret, { expiresIn: '1h' });
    return token;
  }
}
