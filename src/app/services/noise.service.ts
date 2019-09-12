import {Injectable} from '@angular/core';
import * as SimplexNoise from 'simplex-noise';

@Injectable({
    providedIn: 'root'
})
export class NoiseService {

    simplex1;
    simplex2;
    simplex3;

    constructor() {
        this.simplex1 = new SimplexNoise('');
        this.simplex2 = new SimplexNoise('0');
        this.simplex3 = new SimplexNoise('1');
    }

    setSeed(seed) {
        this.simplex1 = new SimplexNoise(seed);
        this.simplex2 = new SimplexNoise('0' + seed);
        this.simplex3 = new SimplexNoise('1' + seed);
    }

    getHeight(x, y): number {
        return 0.35 * this.simplex1.noise2D(x, y)
            + 0.10 * this.simplex2.noise2D(x * 5, y * 5)
            + 0.04 * this.simplex3.noise2D(x * 15, y * 15)
            + 0.01 * this.simplex3.noise2D(x * 50, y * 50)
            + 0.5 * this.simplex3.noise2D(x / 12, y / 12);
    }

    getColor(height) {
        let color;
        if (height < -0.4) {
            color = [64, 149, 219];
        } else if (height >= -0.4 && height < -0.15) {
            color = [93, 207, 245];
        } else if (height >= -0.15 && height < -0.1) {
            color = [255, 244, 176];
        } else if (height >= -0.1 && height < 0.3) {
            color = [86, 183, 82];
        } else if (height >= 0.3 && height < 0.5) {
            color = [150, 141, 130];
        } else if (height >= 0.5) {
            color = [255, 255, 255];
        }
        return color;
    }
}
