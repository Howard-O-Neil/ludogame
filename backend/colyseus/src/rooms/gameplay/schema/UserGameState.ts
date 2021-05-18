import { Dice } from './Dice';
import { Camera } from './Camera';

export interface InitGameState {
  camera: Camera,
  dices: Dice[]
}