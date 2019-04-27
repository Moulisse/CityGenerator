import {Injectable} from '@angular/core';
import * as Rand from 'random-seed';
import {Subject} from 'rxjs';
import {NoiseService} from './noise.service';

@Injectable({
    providedIn: 'root'
})
export class CityService {

    public cityChanged = new Subject<any>();

    public mapWidth = 1500;
    public mapHeight = 1500;
    private rand;

    seed = Math.random() + '';

    // seed = '0';

    constructor(public Noise: NoiseService) {
        this.rand = Rand.create(this.seed);
        this.Noise.setSeed(this.seed);
        this.cityChanged.next();
    }


}
