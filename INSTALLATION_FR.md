# Serveur Webhook Mimir ROSS - Guide d'Installation

## Vue d'Ensemble

Le serveur webhook Mimir ROSS est une application Node.js légère qui assure la synchronisation bidirectionnelle entre le dossier ROSS de Mimir et un répertoire local sur macOS. Il inclut un tableau de bord web pour la surveillance et la gestion.

### Fonctionnalités Principales

- **Téléchargement Automatique** : Les fichiers uploadés dans le dossier Mimir ROSS se synchronisent automatiquement vers le répertoire local
- **Tableau de Bord Web** : Surveillez l'état de synchronisation, visualisez les logs et gérez le serveur via navigateur
- **Tunnel Cloudflare** : Création automatique d'un tunnel sécurisé pour la connectivité webhook
- **Surveillance en Temps Réel** : Logs en direct, comptage de fichiers et statut de synchronisation
- **Intégration Upload** : Accès rapide pour uploader des fichiers via l'interface web de Mimir

### Configuration Requise

- **Système d'Exploitation** : macOS (10.14 ou supérieur)
- **Connexion Internet** : Requise pour l'API Mimir et le tunnel Cloudflare
- **Compte Mimir** : Avec clé API et accès au dossier

---

## Installation via GitHub (Recommandée)

### Étape 1 : Cloner le Dépôt

Ouvrez Terminal et exécutez :

```bash
git clone https://github.com/netventureFrance/Ouest-France_Novo19_Mimir-Ross-Sync.git
cd Ouest-France_Novo19_Mimir-Ross-Sync
```

### Étape 2 : Exécuter le Script d'Installation

```bash
chmod +x install.sh
./install.sh
```

Le script va :
1. Vérifier et installer Homebrew (si nécessaire)
2. Installer Node.js et npm (si nécessaire)
3. Installer le tunnel Cloudflare (cloudflared)
4. Créer la structure de répertoires
5. Installer les dépendances npm
6. Demander les détails de configuration

### Étape 3 : Fournir la Configuration

Lorsque demandé, entrez :

- **ID du Dossier Mimir ROSS** : UUID de votre dossier ROSS (ex : `f082cd14-7d20-4538-aec3-ae01ba15c296`)
- **Clé API Mimir** : Votre token d'authentification API Mimir (ex : `sakm.xxxx...`)
- **Port Serveur** : Port local pour le tableau de bord (par défaut : 3000)

### Étape 4 : Démarrer le Serveur

```bash
node mimir-webhook-server.js
```

Le serveur va :
- Démarrer sur le port configuré (par défaut : http://localhost:3000)
- Créer un tunnel Cloudflare
- Afficher l'URL du tunnel pour la configuration webhook
- Commencer la surveillance du dossier ROSS

---

## Installation Manuelle

Si vous préférez une installation manuelle ou avez besoin de plus de contrôle :

### 1. Installer les Dépendances

#### Installer Homebrew
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Installer Node.js
```bash
brew install node
```

Vérifier l'installation :
```bash
node --version  # Devrait afficher v18.x ou supérieur
npm --version   # Devrait afficher 9.x ou supérieur
```

#### Installer le Tunnel Cloudflare
```bash
brew install cloudflared
```

### 2. Créer le Répertoire du Projet

```bash
mkdir -p ~/Mimir-ROSS-Server
cd ~/Mimir-ROSS-Server
```

### 3. Cloner les Fichiers du Projet

```bash
git clone https://github.com/netventureFrance/Ouest-France_Novo19_Mimir-Ross-Sync.git .
```

### 4. Installer les Packages npm

```bash
npm install
```

---

## Configuration

### Trouver vos Identifiants Mimir

#### ID du Dossier ROSS

1. Connectez-vous à Mimir sur https://mimir.mjoll.no
2. Naviguez vers votre dossier ROSS
3. Copiez l'ID du dossier depuis l'URL :
   ```
   https://mimir.mjoll.no/folders/[FOLDER-ID]
   ```

#### Clé API Mimir

1. Allez dans Mimir Settings → API
2. Créez ou copiez votre clé API
3. Elle devrait commencer par `sakm.`

### Méthodes de Configuration

#### Option A : Variables d'Environnement

Créez un fichier `.env` :

```bash
ROSS_FOLDER_ID=votre-id-dossier-ici
MIMIR_API_KEY=sakm.votre-cle-ici
PORT=3000
```

#### Option B : Éditer le Fichier Serveur

Éditez `mimir-webhook-server.js` et mettez à jour la section CONFIG :

```javascript
const CONFIG = {
  port: 3000,
  rossFolderId: 'votre-id-dossier-ici',
  apiKey: 'sakm.votre-cle-ici',
  mimirApiUrl: 'https://us.mjoll.no/api/v1',
  logFile: 'logs/mimir-ross.log',
  downloadDir: 'ROSS_Images',
  heartbeatInterval: 5
};
```

---

## Exécution du Serveur

### Démarrer le Serveur

```bash
cd ~/Mimir-ROSS-Server
node mimir-webhook-server.js
```

Vous devriez voir une sortie similaire à :

```
🚀 Serveur webhook Mimir en cours d'exécution sur le port 3000
📝 Logs : /Users/username/Mimir-ROSS-Server/logs/mimir-ross.log
🖼️  Téléchargements : /Users/username/Mimir-ROSS-Server/ROSS_Images

📡 Endpoint webhook : http://localhost:3000/webhook/mimir-ross
🏥 Health check : http://localhost:3000/health

[TUNNEL] Démarrage du tunnel Cloudflare...
[TUNNEL] URL du tunnel : https://example-url.trycloudflare.com
[WEBHOOK] URL webhook mise à jour : https://example-url.trycloudflare.com/webhook/mimir-ross
```

### Configurer le Webhook Mimir

Le serveur met automatiquement à jour la configuration webhook de Mimir. Vérifiez dans Mimir :

1. Allez sur https://mimir.mjoll.no → Settings → Webhooks
2. Confirmez que l'URL du webhook correspond à l'URL du tunnel affichée dans les logs du serveur
3. Le webhook devrait être actif pour les événements « Item Creation »

### Accéder au Tableau de Bord

Ouvrez votre navigateur à :
```
http://localhost:3000
```

Vous verrez le tableau de bord Ouest-France | Novo 19 ROSS Manager avec :
- Statut du serveur en temps réel
- Statut du tunnel Cloudflare
- Statut de synchronisation webhook
- Logs en direct
- Comptages de fichiers et informations de stockage
- Boutons d'action (Upload vers Mimir, Sync, etc.)

---

## Exécution en Production

### Utiliser PM2 (Recommandé)

PM2 est un gestionnaire de processus de production pour Node.js :

#### Installer PM2

```bash
npm install -g pm2
```

#### Démarrer avec PM2

```bash
cd ~/Mimir-ROSS-Server
pm2 start mimir-webhook-server.js --name mimir-webhook
```

#### Gérer le Processus

```bash
# Voir les logs
pm2 logs mimir-webhook

# Arrêter le serveur
pm2 stop mimir-webhook

# Redémarrer le serveur
pm2 restart mimir-webhook

# Voir le statut
pm2 status
```

#### Démarrage Automatique au Boot

```bash
pm2 startup
pm2 save
```

Cela garantit que le serveur démarre automatiquement lorsque le Mac boot.

### Utiliser macOS LaunchAgent

Créez un LaunchAgent pour exécuter le serveur au login :

```bash
cat > ~/Library/LaunchAgents/com.ouestfrance.mimir-webhook.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.ouestfrance.mimir-webhook</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/VOTRE_NOM_UTILISATEUR/Mimir-ROSS-Server/mimir-webhook-server.js</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/VOTRE_NOM_UTILISATEUR/Mimir-ROSS-Server/logs/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/VOTRE_NOM_UTILISATEUR/Mimir-ROSS-Server/logs/stderr.log</string>
</dict>
</plist>
EOF
```

Remplacez `VOTRE_NOM_UTILISATEUR` par votre nom d'utilisateur macOS.

Charger l'agent :
```bash
launchctl load ~/Library/LaunchAgents/com.ouestfrance.mimir-webhook.plist
```

---

## Utilisation

### Upload de Fichiers vers Mimir

1. Ouvrez le tableau de bord à http://localhost:3000
2. Allez dans l'onglet **Actions**
3. Cliquez sur **Upload vers Mimir**
4. Glissez-déposez les fichiers dans l'interface web Mimir
5. Les fichiers se téléchargent automatiquement dans le dossier `ROSS_Images/`

### Surveillance de la Synchronisation

- **Onglet Dashboard** : Visualisez le statut du serveur et les statistiques en temps réel
- **Logs en Direct** : Consultez les événements webhook et les opérations sur fichiers
- **Statut Webhook Mimir** : Le point vert indique une synchronisation active

### Gestion du Serveur

Utilisez l'onglet Actions pour :
- **Synchroniser Tous les Fichiers** : Déclencher manuellement une synchronisation complète
- **Voir les Fichiers Téléchargés** : Parcourir les fichiers locaux
- **Redémarrer le Serveur** : Redémarrer le serveur Node.js
- **Effacer les Logs** : Nettoyer l'historique des logs

### Onglet Configuration

Mettre à jour les paramètres :
- Nom et ID du dossier
- Clé API
- Répertoire de téléchargement
- Port du serveur
- Intervalle de heartbeat
- Contrôles du tunnel Cloudflare

---

## Dépannage

### Le Serveur ne Démarre Pas

**Vérifier la disponibilité du port :**
```bash
lsof -i :3000
```

Si le port est utilisé, soit :
- Arrêtez l'autre processus
- Changez le port dans la configuration

**Vérifier Node.js :**
```bash
node --version
npm --version
```

Devrait afficher Node v18+ et npm 9+.

### Le Webhook ne Reçoit Pas

1. Vérifiez les logs du serveur pour les erreurs
2. Vérifiez que le tunnel Cloudflare est en cours d'exécution (statut vert dans le tableau de bord)
3. Vérifiez que la configuration webhook de Mimir correspond à l'URL du tunnel
4. Testez le endpoint de santé :
   ```bash
   curl http://localhost:3000/health
   ```

### Les Fichiers ne se Téléchargent Pas

1. Vérifiez que la clé API est valide
2. Vérifiez que l'ID du dossier est correct
3. Vérifiez les permissions du répertoire `ROSS_Images/` :
   ```bash
   ls -la ~/Mimir-ROSS-Server/ROSS_Images
   ```
4. Consultez les logs dans le tableau de bord ou :
   ```bash
   tail -f ~/Mimir-ROSS-Server/logs/mimir-ross.log
   ```

### Problèmes du Tunnel Cloudflare

**Redémarrer le tunnel :**
1. Allez dans l'onglet Configuration du tableau de bord
2. Cliquez sur « Stop Tunnel »
3. Cliquez sur « Start Tunnel »

**Vérifier cloudflared :**
```bash
cloudflared --version
```

Si non trouvé :
```bash
brew install cloudflared
```

---

## Emplacements des Fichiers

```
~/Mimir-ROSS-Server/
├── mimir-webhook-server.js          # Serveur principal
├── package.json                      # Dépendances
├── node_modules/                     # Packages installés
├── public/                           # Tableau de bord web
│   ├── index.html                    # HTML du tableau de bord
│   ├── styles.css                    # Styles
│   └── app.js                        # JavaScript du tableau de bord
├── logs/
│   └── mimir-ross.log               # Logs du serveur
├── ROSS_Images/                     # Fichiers téléchargés
└── config.json                      # Configuration (si utilisation fichier config)
```

---

## Notes de Sécurité

### Protection de la Clé API

- Ne commitez jamais `config.json` ou `.env` dans le contrôle de version
- Stockez les clés API de manière sécurisée
- Utilisez des variables d'environnement en production

### Pare-feu

Le serveur nécessite uniquement :
- HTTPS sortant (443) pour l'API Mimir
- HTTP/HTTPS sortant pour le tunnel Cloudflare
- Port local (par défaut 3000) pour l'accès au tableau de bord

### Permissions des Fichiers

Assurez-vous que le répertoire `ROSS_Images/` a les permissions appropriées :

```bash
chmod 755 ~/Mimir-ROSS-Server/ROSS_Images
```

---

## Support

### Logs

Vérifiez les logs du serveur pour des informations détaillées :

```bash
tail -f ~/Mimir-ROSS-Server/logs/mimir-ross.log
```

Ou visualisez en direct dans le tableau de bord.

### Problèmes Courants

| Problème | Solution |
|----------|----------|
| Port déjà utilisé | Changez PORT dans config ou tuez le processus avec `lsof -ti:3000 \| xargs kill` |
| Échec authentification API | Vérifiez la clé API dans les paramètres Mimir |
| Fichiers ne se synchronisent pas | Vérifiez l'ID du dossier et la configuration webhook |
| Échec connexion tunnel | Redémarrez le serveur ou vérifiez la connexion Internet |

### Obtenir de l'Aide

Contactez votre administrateur système ou l'équipe de développement avec :
- Logs du serveur (`logs/mimir-ross.log`)
- Configuration (sans la clé API)
- Capture d'écran du tableau de bord
- Description du problème

---

## Mise à Jour

Pour mettre à jour le serveur :

1. Arrêtez le serveur :
   ```bash
   pm2 stop mimir-webhook  # Si utilisation de PM2
   ```

2. Sauvegardez l'installation actuelle :
   ```bash
   cp -r ~/Mimir-ROSS-Server ~/Mimir-ROSS-Server-backup
   ```

3. Récupérez les dernières modifications :
   ```bash
   cd ~/Mimir-ROSS-Server
   git pull origin main
   ```

4. Mettez à jour les dépendances :
   ```bash
   npm install
   ```

5. Redémarrez le serveur :
   ```bash
   pm2 restart mimir-webhook  # Si utilisation de PM2
   ```

---

## Désinstallation

Pour supprimer le serveur :

1. Arrêtez le serveur :
   ```bash
   pm2 delete mimir-webhook  # Si utilisation de PM2
   ```

2. Supprimez le LaunchAgent (si configuré) :
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.ouestfrance.mimir-webhook.plist
   rm ~/Library/LaunchAgents/com.ouestfrance.mimir-webhook.plist
   ```

3. Supprimez le répertoire d'installation :
   ```bash
   rm -rf ~/Mimir-ROSS-Server
   ```

---

## Spécifications Techniques

- **Langage** : Node.js (JavaScript)
- **Dépendances** : Express.js, Axios
- **Services Externes** : API Mimir, Tunnel Cloudflare
- **Base de Données** : Aucune (logs basés sur fichiers)
- **Architecture** : Serveur Node.js mono-thread
- **Utilisation Mémoire** : ~30-50MB
- **Utilisation Disque** : ~20MB + fichiers téléchargés

---

## Captures d'Écran du Processus d'Installation

Pour documenter le processus d'installation, prenez les captures d'écran suivantes :

1. **Terminal pendant l'installation** : Montrant la sortie du script `install.sh`
2. **Invites de configuration** : Lorsque le script demande l'ID du dossier et la clé API
3. **Démarrage du serveur** : Affichant les messages de démarrage et l'URL du tunnel
4. **Premier accès au tableau de bord** : Page d'accueil du tableau de bord

Placez ces captures dans le dossier `screenshots/installation/`

---

**Version** : 1.0
**Dernière Mise à Jour** : Novembre 2025
**Maintenu Par** : Équipe IT Ouest-France
