import { nanoid } from "nanoid";
import create from "zustand";
import Piece from "./components/Piece";
import {
  initFinalRoutes,
  initCommonRoutes,
  initBaseNodes,
  getStartNodes,
  colors,
} from "./utils";

export const GAME_STATE = Object.freeze({
  WAITING: "WAITING",
  ROLL_DICE: "ROLL_DICE",
  SWITCH_PLAYER: "SWITCH_PLAYER",
});

const useStore = create((set, get) => {
  return {
    commonRoutes: initCommonRoutes(),
    finalRoutes: initFinalRoutes(),
    baseNodes: initBaseNodes(),
    startNodes: getStartNodes(),
    pieces: [],
    playerList: [],
    activePlayer: 0,
    diceStop: false,
    diceNumber: 0,
    state: GAME_STATE.WAITING,
    rollDice: undefined,
    actions: {
      initPieces() {
        const { baseNodes } = get();
        let tempArray = [];
        colors.map((color, i) => {
          baseNodes[i].map((base, j) => {
            tempArray.push(
              <Piece
                key={nanoid()}
                position={base}
                args={[0.08, 0.7, 2, 50]}
                color={color}
                player={i}
                num={j}
              />
            );
          });
        });
        set({ pieces: tempArray });
      },

      setState(state) {
        set({ state });
      },
      setDiceNumber(num) {
        set({ diceNumber: num });
      },
    },
  };
});
export default useStore;
