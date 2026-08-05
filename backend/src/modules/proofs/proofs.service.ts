import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class ProofsService {
  private readonly logger = new Logger(ProofsService.name);
  private readonly secretKey = process.env.JWT_SECRET || 'send_moi_secret_key_2026';

  /**
   * Generate an unforgeable cryptographic SHA-256 signature for a mission proof
   */
  generateProofSignature(
    missionId: string,
    agentId: string,
    lat: number,
    lng: number,
    timestampIso: string,
  ): string {
    const rawData = `${missionId}:${agentId}:${lat}:${lng}:${timestampIso}`;
    const hash = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawData)
      .digest('hex');

    this.logger.log(`🔑 Signature cryptographique générée pour mission ${missionId} : ${hash.substring(0, 16)}...`);
    return hash;
  }

  /**
   * Verify if a proof signature is authentic
   */
  verifyProofSignature(
    missionId: string,
    agentId: string,
    lat: number,
    lng: number,
    timestampIso: string,
    signatureToVerify: string,
  ): boolean {
    if (!signatureToVerify || typeof signatureToVerify !== 'string') {
      return false;
    }

    const expectedHash = this.generateProofSignature(missionId, agentId, lat, lng, timestampIso);
    const bufExpected = Buffer.from(expectedHash, 'hex');
    const bufActual = Buffer.from(signatureToVerify, 'hex');

    if (bufExpected.length !== bufActual.length) {
      return false;
    }

    return crypto.timingSafeEqual(bufExpected, bufActual);
  }
}
