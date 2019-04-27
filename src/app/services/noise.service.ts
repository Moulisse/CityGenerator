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

    getNoise(x, y): number {
        const averaged = 0.8 * this.simplex1.noise2D(x, y) + 0.15 * this.simplex2.noise2D(x * 5, y * 5) + 0.05 * this.simplex3.noise2D(x * 15, y * 15);
        return averaged;
    }
}
