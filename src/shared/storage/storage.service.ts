import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, existsSync, promises as fs } from 'fs';
import { extname, join, normalize, resolve } from 'path';
import { v4 as uuid } from 'uuid';

export interface StoredFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  relativePath: string; // ex: "ocorrencias/uuid.xml"
  absolutePath: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly baseDir: string;

  constructor(cfg: ConfigService) {
    this.baseDir = resolve(cfg.get<string>('upload.dir') ?? './uploads');
  }

  async init(subdirs: string[] = ['ocorrencias', 'comunicados', 'contratos']) {
    await fs.mkdir(this.baseDir, { recursive: true });
    for (const sd of subdirs) {
      await fs.mkdir(join(this.baseDir, sd), { recursive: true });
    }
  }

  async store(
    file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    subdir: string,
  ): Promise<StoredFile> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Arquivo inválido');
    }
    await fs.mkdir(join(this.baseDir, subdir), { recursive: true });

    const safeExt = extname(file.originalname).toLowerCase().slice(0, 16);
    const filename = `${uuid()}${safeExt}`;
    const absolutePath = join(this.baseDir, subdir, filename);
    await fs.writeFile(absolutePath, file.buffer);

    return {
      filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      relativePath: `${subdir}/${filename}`,
      absolutePath,
    };
  }

  resolvePath(relativePath: string): string {
    // protege contra path traversal
    const resolved = normalize(join(this.baseDir, relativePath));
    if (!resolved.startsWith(this.baseDir)) {
      throw new BadRequestException('Caminho de arquivo inválido');
    }
    return resolved;
  }

  async loadAsStream(relativePath: string) {
    const p = this.resolvePath(relativePath);
    if (!existsSync(p)) throw new BadRequestException('Arquivo não encontrado');
    return createReadStream(p);
  }

  async delete(relativePath: string) {
    try {
      await fs.unlink(this.resolvePath(relativePath));
    } catch (e) {
      this.logger.warn(`Falha ao excluir arquivo ${relativePath}: ${(e as Error).message}`);
    }
  }
}
