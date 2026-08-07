import { Test, TestingModule } from '@nestjs/testing';
import { ProofsService } from './proofs.service';

describe('ProofsService (Cryptographic Proof Verification)', () => {
  let service: ProofsService;
  const originalEnv = process.env.JWT_SECRET;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'super_secret_test_key_sha256_2026';
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProofsService],
    }).compile();

    service = module.get<ProofsService>(ProofsService);
  });

  afterAll(() => {
    process.env.JWT_SECRET = originalEnv;
  });

  it('devrait lever une erreur critique si JWT_SECRET est absent', () => {
    delete process.env.JWT_SECRET;
    expect(() => service.generateProofSignature('m1', 'a1', 4.05, 9.76, '2026-08-07T10:00:00Z')).toThrow(
      'CRITICAL: Variable JWT_SECRET non configurée en environnement.',
    );
  });

  it('devrait générer une signature HMAC-SHA-256 de 64 caractères hexadécimaux', () => {
    const signature = service.generateProofSignature('mission-101', 'agent-55', 4.0511, 9.7679, '2026-08-07T10:00:00.000Z');
    expect(signature).toHaveLength(64);
    expect(signature).toMatch(/^[a-f0-9]{64}$/);
  });

  it('devrait valider une signature authentique (Timing-Safe Check)', () => {
    const timestamp = '2026-08-07T10:00:00.000Z';
    const validSignature = service.generateProofSignature('m-1', 'a-1', 4.05, 9.76, timestamp);

    const isValid = service.verifyProofSignature('m-1', 'a-1', 4.05, 9.76, timestamp, validSignature);
    expect(isValid).toBe(true);
  });

  it('devrait rejeter une preuve avec coordonnées GPS altérées ou falsifiées', () => {
    const timestamp = '2026-08-07T10:00:00.000Z';
    const validSignature = service.generateProofSignature('m-1', 'a-1', 4.05, 9.76, timestamp);

    // Tampered GPS coordinates (GPS Spoofing attack)
    const isValid = service.verifyProofSignature('m-1', 'a-1', 4.0888, 9.76, timestamp, validSignature);
    expect(isValid).toBe(false);
  });

  it('devrait rejeter une preuve avec horodatage falsifié (Replay Attack)', () => {
    const validSignature = service.generateProofSignature('m-1', 'a-1', 4.05, 9.76, '2026-08-07T10:00:00.000Z');

    // Tampered timestamp
    const isValid = service.verifyProofSignature('m-1', 'a-1', 4.05, 9.76, '2026-08-07T10:15:00.000Z', validSignature);
    expect(isValid).toBe(false);
  });

  it('devrait rejeter les signatures tronquées, vides ou mal formées', () => {
    expect(service.verifyProofSignature('m-1', 'a-1', 4.05, 9.76, '2026', '')).toBe(false);
    expect(service.verifyProofSignature('m-1', 'a-1', 4.05, 9.76, '2026', 'short_hash')).toBe(false);
  });
});
