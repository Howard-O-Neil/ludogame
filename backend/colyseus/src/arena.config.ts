import Arena from "@colyseus/arena";
import { monitor } from "@colyseus/monitor";

/**
 * Import your Room files
 */
import { MyRoom } from "./rooms/MyRoom";

export default Arena({
  getId: () => "Your Colyseus App",

  initializeGameServer: (gameServer) => {
    // define main room for all use among all game
    gameServer.define("main_game", MyRoom);
  },

  initializeExpress: (app) => {
    /**
     * Bind your custom express routes here:
     */
    app.get("/", (req, res) => {
      res.send("It's time to kick ass and chew bubblegum!");
    });

    /**
     * Bind @colyseus/monitor
     * It is recommended to protect this route with a password.
     * Read more: https://docs.colyseus.io/tools/monitor/
     */
    app.use("/colyseus", monitor());
  },

  beforeListen: () => {
    /**
     * Before before gameServer.listen() is called.
     */
  },
});
