import axios from "axios";
import { createWriteStream } from "fs";
import { unlink } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import ffmpeg from 'fluent-ffmpeg';
import installer from '@ffmpeg-installer/ffmpeg';

const __dirName = dirname(fileURLToPath(import.meta.url));

class Converter {
  constructor() {
    ffmpeg.setFfmpegPath(installer.path)
  }

  async toMp3(input, fileName) {
    try {
        const outputPath = resolve(dirname(input), `${fileName}.mp3`);

        return new Promise((resolve, reject) => {
            ffmpeg(input)
                .inputOption('-t 30')
                .output(outputPath)
                .on('end', () => {
                    this.removeFile(input)
                    resolve(outputPath);
                })
                .on('error', (e) => reject("FFMPEG error converting file", e?.message || e))
                .run()
        })
    } catch (error) {
        console.log("Error converting voice:", error?.message || error);
    }
  }

  async create(url, filename) {
    try {
      const oggPath = resolve(__dirName, "../voices", `${filename}.ogg`);
      const res = await axios({
        method: "get",
        url,
        responseType: "stream",
      });
      return new Promise((resolve) => {
        const stream = createWriteStream(oggPath);
        res.data.pipe(stream);
        stream.on("finish", () => resolve(oggPath));
      });
    } catch (error) {
      console.log("Error creating voice:", error?.message || error);
    }
  }

  async removeFile(path) {
    try {
        await unlink(path)
    } catch (error) {
        console.log(`Error deleting file: ${path}`, error?.message || error);
    }
  }
}

export const converter = new Converter();
