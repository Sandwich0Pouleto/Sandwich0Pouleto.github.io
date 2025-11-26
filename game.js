// game.js - Version Web Pure
class Game {
    constructor() {
        this.canvas = null;
        this.players = {};
        this.myId = null;
        this.myCar = null;
        this.keys = {};
        this.socket = null;
        this.track = new Track();
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.getElementById('playButton').addEventListener('click', () => {
            this.connectToServer();
        });
        
        // Contrôles clavier
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === 'Escape') this.showMenu();
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }
    
    connectToServer() {
        const pseudo = document.getElementById('pseudoInput').value || 'Joueur';
        const color = document.getElementById('colorInput').value;
        
        // Pour l'instant, on simule le multijoueur en local
        // Plus tard on intégrera un vrai service WebSocket
        this.startLocalGame(pseudo, color);
    }
    
    startLocalGame(pseudo, colorHex) {
        document.getElementById('menu').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        
        // Convertir couleur hex en RGB
        const color = this.hexToRgb(colorHex);
        
        this.myId = 'local';
        this.myCar = new Car(500, 300, color, this.myId, pseudo);
        
        // Démarrer la boucle de jeu
        this.setupCanvas();
        this.gameLoop();
        
        // Ajouter quelques joueurs bots pour la démo
        this.addBot('Bot1', [0, 255, 0], 600, 300);
        this.addBot('Bot2', [0, 0, 255], 400, 300);
    }
    
    addBot(pseudo, color, x, y) {
        const bot = new Car(x, y, color, pseudo, pseudo);
        this.players[pseudo] = bot;
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        if (this.myCar) {
            this.myCar.update(this.keys);
            
            // Mettre à jour le HUD
            document.getElementById('speed').textContent = 
                Math.abs(Math.round(this.myCar.speed * 15));
            document.getElementById('players').textContent = 
                Object.keys(this.players).length + 1;
            document.getElementById('posX').textContent = Math.round(this.myCar.x);
            document.getElementById('posY').textContent = Math.round(this.myCar.y);
        }
        
        // Mettre à jour les bots
        Object.values(this.players).forEach(bot => {
            bot.updateBot();
        });
    }
    
    draw() {
        if (!this.ctx) return;
        
        // Effacer l'écran
        this.ctx.fillStyle = '#162447';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Dessiner la piste
        this.track.draw(this.ctx, this.myCar ? this.myCar.x : 0, this.myCar ? this.myCar.y : 0);
        
        // Dessiner les autres joueurs
        Object.values(this.players).forEach(car => {
            car.draw(this.ctx, this.myCar ? this.myCar.x : 0, this.myCar ? this.myCar.y : 0);
        });
        
        // Dessiner ma voiture
        if (this.myCar) {
            this.myCar.draw(this.ctx, this.myCar.x, this.myCar.y);
        }
    }
    
    showMenu() {
        document.getElementById('menu').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : [255, 0, 0];
    }
}

class Car {
    constructor(x, y, color, id, pseudo) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.id = id;
        this.pseudo = pseudo;
        this.speed = 0;
        this.maxSpeed = 10;
        this.acceleration = 0.2;
        this.braking = 0.3;
        this.direction = 0;
        this.turnSpeed = 3;
        this.length = 40;
        this.width = 20;
    }
    
    update(keys) {
        // Accélération
        if (keys['ArrowUp'] || keys['z'] || keys['Z']) {
            this.speed = Math.min(this.speed + this.acceleration, this.maxSpeed);
        } 
        // Freinage
        else if (keys['ArrowDown'] || keys['s'] || keys['S']) {
            this.speed = Math.max(this.speed - this.braking, -this.maxSpeed / 2);
        } 
        // Ralentissement naturel
        else {
            this.speed *= 0.96;
        }
        
        // Direction
        if (Math.abs(this.speed) > 0.5) {
            const turn = this.turnSpeed * (Math.abs(this.speed) / this.maxSpeed);
            if (keys['ArrowLeft'] || keys['q'] || keys['Q']) {
                this.direction -= turn;
            }
            if (keys['ArrowRight'] || keys['d'] || keys['D']) {
                this.direction += turn;
            }
        }
        
        // Déplacement
        const rad = this.direction * Math.PI / 180;
        this.x += this.speed * Math.cos(rad);
        this.y += this.speed * Math.sin(rad);
    }
    
    updateBot() {
        // Logique simple pour les bots
        this.speed = 2;
        this.direction += 1;
        
        const rad = this.direction * Math.PI / 180;
        this.x += this.speed * Math.cos(rad);
        this.y += this.speed * Math.sin(rad);
    }
    
    draw(ctx, cameraX, cameraY) {
        const screenX = this.x - cameraX + ctx.canvas.width / 2;
        const screenY = this.y - cameraY + ctx.canvas.height / 2;
        
        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(this.direction * Math.PI / 180);
        
        // Corps de la voiture
        ctx.fillStyle = `rgb(${this.color[0]}, ${this.color[1]}, ${this.color[2]})`;
        ctx.fillRect(-this.length/2, -this.width/2, this.length, this.width);
        
        // Détails
        ctx.fillStyle = `rgb(${Math.max(0, this.color[0]-50)}, ${Math.max(0, this.color[1]-50)}, ${Math.max(0, this.color[2]-50)})`;
        ctx.fillRect(-this.length/2 + 10, -this.width/2, this.length - 20, this.width);
        
        // Vitres
        ctx.fillStyle = 'rgb(150, 200, 255)';
        ctx.fillRect(-this.length/2 + 12, -this.width/2 + 2, 8, this.width - 4);
        ctx.fillRect(this.length/2 - 20, -this.width/2 + 2, 8, this.width - 4);
        
        // Roues
        ctx.fillStyle = 'black';
        [[-15, -12], [15, -12], [-15, 8], [15, 8]].forEach(([x, y]) => {
            ctx.fillRect(x, y, 6, 4);
        });
        
        ctx.restore();
        
        // Pseudo
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.pseudo, screenX, screenY - 30);
    }
}

class Track {
    constructor() {
        this.width = 180;
        this.points = this.generateTrack();
    }
    
    generateTrack() {
        const points = [];
        const numPoints = 100;
        
        for (let i = 0; i < numPoints; i++) {
            const t = (i / numPoints) * 2 * Math.PI;
            const scale = 1000;
            
            const x = scale * Math.sin(t) / (1 + Math.cos(t)**2);
            const y = scale * Math.sin(t) * Math.cos(t) / (1 + Math.cos(t)**2);
            
            points.push({x, y});
        }
        
        return points;
    }
    
    draw(ctx, cameraX, cameraY) {
        // Dessiner l'herbe
        ctx.fillStyle = '#1a3c27';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // Dessiner la piste (simplifié)
        ctx.strokeStyle = 'white';
        ctx.lineWidth = this.width;
        ctx.beginPath();
        
        this.points.forEach((point, i) => {
            const screenX = point.x - cameraX + ctx.canvas.width / 2;
            const screenY = point.y - cameraY + ctx.canvas.height / 2;
            
            if (i === 0) {
                ctx.moveTo(screenX, screenY);
            } else {
                ctx.lineTo(screenX, screenY);
            }
        });
        
        ctx.closePath();
        ctx.stroke();
    }
}

// Démarrer le jeu quand la page est chargée
window.addEventListener('load', () => {
    new Game();
});