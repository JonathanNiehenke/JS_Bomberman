let db = console.log;
let dbo = console.table;

function TileBomber() {
    this.__proto__ = new Engine(undefined, " ", " ");
    this.player1 = {
        "index": undefined,
        "facing": "b",
        "toDirection": {"-1,0": "a", "1,0": "b", "0,-1": "c", "0,1": "d"},
        "bomb": "*",
    };
    this.player2 = {
        "index": undefined,
        "facing": "A",
        "toDirection": {"-1,0": "A", "1,0": "B", "0,-1": "C", "0,1": "D"},
        "bomb": "+",
    };
    this.keyInput = {
        "38": {"player": this.player1, "Movement": new IndexObj(-1, 0)},
        "40": {"player": this.player1, "Movement": new IndexObj(1, 0)},
        "37": {"player": this.player1, "Movement": new IndexObj(0, -1)},
        "39": {"player": this.player1, "Movement": new IndexObj(0, 1)},
        "17": {"player": this.player1, "Movement": undefined},
        "16": {"player": this.player1, "Movement": undefined},
        "87": {"player": this.player2, "Movement": new IndexObj(-1, 0)},
        "83": {"player": this.player2, "Movement": new IndexObj(1, 0)},
        "65": {"player": this.player2, "Movement": new IndexObj(0, -1)},
        "68": {"player": this.player2, "Movement": new IndexObj(0, 1)},
        "81": {"player": this.player2, "Movement": undefined},
        "69": {"player": this.player2, "Movement": undefined},
        "handle": function(keyEvent) {
            let Input = this.keyInput[keyEvent.keyCode];
            if (Input && Input.Movement) {
                let moveTo = Input.player.index.add(Input.Movement);
                let cellTo = this.Environment.cell[moveTo.toString()];
                let cellAction = this.Tile[cellTo].action;
                if (cellAction) {
                    cellAction.call(this, Input.player, moveTo, Input.Movement);
                }
            }
            else if (Input) {
                let player = Input.player;
                this.Environment.cell[player.index.toString()] = player.bomb;
            }
        },
    };
    this.convert = {
        "toMovement": {
            "^": new IndexObj(-1,0),
            "v": new IndexObj(1,0),
            "<": new IndexObj(0,-1),
            ">": new IndexObj(0,1)
        },
    };
    this.parseLevelFile = function*(levelFile) {
        let fileLines = levelFile.target.result.split("\n");
        Structure = [];
        for (let Line of fileLines) {
            if (!Line && Structure.length) {
                yield Structure;
                // Previous references are gone.
                Structure = [];
            }
            else {
                Structure.push(Line);
            }
        }
    };
    this.handleFileEvent = function(fileEvent) {
        function onFileLoad(levelFile) {
            this.Levels = this.parseLevelFile(levelFile);
            this.Environment = this.nextEnvironment();
            let emptyLocations = this.Environment.cellLocations[" "];
            this.player1.index = emptyLocations[0];
            this.player2.index = emptyLocations[emptyLocations.length - 1];
            this.replaceImage(this.player1.index, this.player1.facing);
            this.replaceImage(this.player2.index, this.player2.facing);
        }
        let levelFile = fileEvent.target.files[0];
        if (levelFile) {
            let Reader = new FileReader();
            Reader.onload = onFileLoad.bind(this);
            Reader.readAsText(levelFile);  // Calls Reader.onload.
            document.getElementById("Game").className = "";
            document.getElementById("levels").className = "Hidden";
        }
    };
    this.movePlayer = function(player, moveTo, Movement) {
        let otherPlayer = player === this.player1 ? this.player2: this.player1;
        if (moveTo.equal(otherPlayer.index)) {
            this.changeFacing(player, moveTo, Movement);
        }
        else {
            let Facing = player.toDirection[Movement.toString()];
            this.placePlayer(player.index, moveTo, Facing)
            player.index = moveTo;
            player.facing = Facing;
        }
    };
    this.changeFacing = function(player, _, Movement) {
        this.movePlayer(player, player.index, Movement);
    };
    this.__constructTiles = function() {
        let getImg = document.getElementById.bind(document);
        let Tile = {
            " ": {"image": getImg("Empty"), "action": this.movePlayer},
            "#": {"image": getImg("Wall"), "action": this.changeFacing},
            "$": {"image": getImg("p1Down"), "action": undefined},
            "&": {"image": getImg("p2Up"), "action": undefined},
            "a": {"image": getImg("p1Up"), "action": undefined},
            "b": {"image": getImg("p1Down"), "action": undefined},
            "c": {"image": getImg("p1Left"), "action": undefined},
            "d": {"image": getImg("p1Right"), "action": undefined},
            "A": {"image": getImg("p2Up"), "action": undefined},
            "B": {"image": getImg("p2Down"), "action": undefined},
            "C": {"image": getImg("p2Left"), "action": undefined},
            "D": {"image": getImg("p2Right"), "action": undefined},
            "*": {"image": getImg("Bomb"), "action": undefined},
            "+": {"image": getImg("Bomb"), "action": undefined},
        };
        return Tile;
    };
    this.Tile = this.__constructTiles();
}

function init() {
    let Bomberman = new TileBomber();
    let handleFileEvent = Bomberman.handleFileEvent.bind(Bomberman);
    document.getElementById("levels").addEventListener(
        "change", handleFileEvent, false);
    let handleKey = Bomberman.keyInput.handle.bind(Bomberman);
    document.addEventListener("keydown", handleKey);
}
