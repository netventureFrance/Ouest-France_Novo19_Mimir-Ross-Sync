# Guide de Capture d'Écran / Screenshot Capture Guide

Ce document liste toutes les captures d'écran nécessaires pour compléter la documentation.

---

## Captures d'Écran du Tableau de Bord

### 1. dashboard-main.png
**Vue principale du tableau de bord**
- Ouvrir : http://localhost:3000
- Onglet : Monitor (Dashboard)
- Montrer : Vue complète de la page avec toutes les sections visibles
- État recommandé : Serveur en cours d'exécution, tunnel actif (points verts)

### 2. monitor-tab.png
**Onglet Monitor avec statistiques**
- Onglet : Monitor (Dashboard)
- Focus : Section des statistiques en haut
- Montrer :
  - Statut du serveur (point vert pulsant)
  - Uptime
  - Statut du tunnel Cloudflare
  - Statut webhook Mimir
  - URL du webhook
  - Compteurs de fichiers
  - Utilisation du stockage

### 3. actions-tab.png
**Onglet Actions avec boutons**
- Cliquer sur l'onglet : Actions
- Montrer : Tous les boutons d'action disponibles
  - Upload vers Mimir
  - Sync All Files
  - View Downloaded Files
  - Restart Server
  - Clear Logs

### 4. configuration-tab.png
**Onglet Configuration**
- Cliquer sur l'onglet : Configuration
- Montrer :
  - Section Webhook URL avec contrôles du tunnel
  - Section Configuration avec tous les champs
  - Boutons Start/Stop Tunnel
- **Important** : Masquez ou flouter la clé API avant de capturer

### 5. live-logs.png
**Section des logs en direct**
- Onglet : Monitor (Dashboard)
- Scroll vers le bas jusqu'à la section Logs
- Montrer :
  - En-tête « Live Logs »
  - Boutons Auto-scroll et Refresh
  - Quelques lignes de logs (avec événements intéressants si possible)

### 6. tunnel-management.png
**Gestion du tunnel Cloudflare**
- Onglet : Configuration
- Focus : Section « Webhook URL »
- Montrer :
  - Statut du tunnel (Running avec point vert)
  - URL du tunnel affichée
  - Boutons Start/Stop Tunnel

### 7. toast-notifications.png
**Exemples de notifications toast**
- Capturer plusieurs types de notifications :
  - Notification de succès (verte)
  - Notification d'erreur (rouge)
  - Notification d'info (bleue)
- Astuce : Effectuez des actions pour déclencher les notifications, puis capturez rapidement

### 8. upload-process.png
**Interface d'upload Mimir**
- Cliquer sur « Upload vers Mimir » dans l'onglet Actions
- Capturer : La page Mimir qui s'ouvre
- Montrer : Zone de drag-and-drop ou interface d'upload

---

## Captures d'Écran de l'Installation

### Installation/1-terminal-installation.png
**Terminal pendant l'installation**
- Exécuter : `./install.sh`
- Capturer : La sortie du terminal montrant :
  - Vérification de Homebrew
  - Installation de Node.js
  - Installation de cloudflared
  - Création des répertoires

### Installation/2-configuration-prompts.png
**Invites de configuration**
- Capturer : Lorsque le script demande :
  - Mimir ROSS Folder ID
  - Mimir API Key
  - Server Port
- **Important** : Masquez les valeurs réelles avant publication

### Installation/3-server-startup.png
**Démarrage du serveur**
- Exécuter : `node mimir-webhook-server.js`
- Capturer : Les messages de démarrage du serveur
  - Messages de démarrage
  - URL du tunnel Cloudflare
  - URL du webhook

### Installation/4-first-dashboard-access.png
**Premier accès au tableau de bord**
- Ouvrir : http://localhost:3000 pour la première fois
- Capturer : La page initiale du tableau de bord

---

## Captures d'Écran Supplémentaires (Optionnelles)

### file-gallery-modal.png
**Modal de galerie de fichiers**
- Onglet : Actions
- Cliquer sur : View Downloaded Files
- Montrer : Modal affichant les fichiers téléchargés avec :
  - Vignettes (si disponibles)
  - Informations sur les fichiers
  - Boutons de copie

### folder-browser-modal.png
**Modal de sélection de dossier**
- Onglet : Configuration
- Cliquer sur : Bouton Browse à côté de Download Directory
- Montrer : Interface de navigation de dossiers

### webhook-synced-status.png
**État de synchronisation du webhook**
- Montrer : Indicateur « Mimir Webhook » avec point vert et texte « Synced »

### webhook-not-synced-status.png
**État non synchronisé du webhook**
- Montrer : Indicateur « Mimir Webhook » avec point rouge et texte « Not Synced »

---

## Instructions de Capture

### Sur macOS :

**Capture d'écran complète :**
```
Cmd + Shift + 3
```

**Capture d'une zone sélectionnée :**
```
Cmd + Shift + 4
```
Puis cliquer-glisser pour sélectionner la zone

**Capture d'une fenêtre spécifique :**
```
Cmd + Shift + 4, puis appuyer sur Espace
```
Cliquer sur la fenêtre à capturer

### Conseils :

1. **Résolution** : Utilisez une résolution suffisante (minimum 1920x1080 recommandé)
2. **Fenêtre de navigateur** : Redimensionnez pour montrer tout le contenu sans scroll si possible
3. **État propre** : Assurez-vous que le serveur est dans un état propre/stable
4. **Données sensibles** : Masquez toujours :
   - Clé API Mimir
   - ID de dossier (si sensible)
   - Chemins système révélant des noms d'utilisateur si nécessaire
5. **Format** : Sauvegardez en PNG pour la meilleure qualité
6. **Nommage** : Utilisez exactement les noms de fichiers listés ci-dessus

---

## Organisation des Fichiers

```
screenshots/
├── SCREENSHOTS_GUIDE.md           # Ce fichier
├── dashboard-main.png
├── monitor-tab.png
├── actions-tab.png
├── configuration-tab.png
├── live-logs.png
├── tunnel-management.png
├── toast-notifications.png
├── upload-process.png
├── file-gallery-modal.png        # Optionnel
├── folder-browser-modal.png      # Optionnel
├── webhook-synced-status.png     # Optionnel
├── webhook-not-synced-status.png # Optionnel
└── installation/
    ├── 1-terminal-installation.png
    ├── 2-configuration-prompts.png
    ├── 3-server-startup.png
    └── 4-first-dashboard-access.png
```

---

## Après Capture

1. Vérifiez que toutes les captures sont claires et lisibles
2. Masquez toutes les données sensibles
3. Compressez les images si nécessaire (optimisation PNG)
4. Commitez les images dans le dépôt git :
   ```bash
   git add screenshots/
   git commit -m "Add documentation screenshots"
   git push
   ```

---

**Note** : Les références aux images dans README_FR.md et INSTALLATION_FR.md fonctionneront automatiquement une fois que les fichiers seront placés aux emplacements corrects.
