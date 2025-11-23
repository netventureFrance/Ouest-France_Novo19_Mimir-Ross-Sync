# Serveur Webhook Mimir ROSS

**Ouest-France | Novo 19 - Gestionnaire de Ressources Graphiques**

Un serveur webhook Node.js léger pour la synchronisation bidirectionnelle entre le dossier ROSS de Mimir et le stockage macOS local, avec un tableau de bord de gestion web.

---

## Démarrage Rapide

### Pour les Utilisateurs

1. **Cloner** le dépôt GitHub :
   ```bash
   git clone https://github.com/netventureFrance/Ouest-France_Novo19_Mimir-Ross-Sync.git
   cd Ouest-France_Novo19_Mimir-Ross-Sync
   ```

2. **Exécuter** le script d'installation :
   ```bash
   chmod +x install.sh
   ./install.sh
   ```

3. **Suivre** les invites pour configurer vos identifiants Mimir

4. **Démarrer** le serveur :
   ```bash
   node mimir-webhook-server.js
   ```

5. **Accéder** au tableau de bord à http://localhost:3000

![Tableau de bord principal](screenshots/dashboard-main.png)

### Pour les Administrateurs Système

Voir **[INSTALLATION_FR.md](./INSTALLATION_FR.md)** pour des instructions de déploiement complètes.

---

## Fonctionnalités

- ✅ **Téléchargements Automatiques** : Les fichiers uploadés vers Mimir → synchronisés automatiquement vers le répertoire local
- ✅ **Intégration Upload** : Accès rapide pour uploader des fichiers via l'interface web Mimir
- ✅ **Tableau de Bord Web** : Surveillance en temps réel, logs et gestion
- ✅ **Tunnel Cloudflare** : Tunnel automatique sécurisé pour la connectivité webhook
- ✅ **Nettoyage des Fichiers** : Supprime automatiquement les fichiers locaux supprimés de Mimir

---

## Configuration Requise

- macOS 10.14 ou supérieur
- Connexion Internet
- Compte Mimir avec accès API

---

## Fonctionnalités du Tableau de Bord

### Onglet Monitor (http://localhost:3000)

![Onglet Monitor](screenshots/monitor-tab.png)

**Statistiques affichées :**
- État du serveur et temps de fonctionnement
- État du tunnel Cloudflare
- Indicateur de synchronisation webhook
- Nombre de fichiers et utilisation du stockage
- Logs serveur en direct

**Indicateurs de statut :**
- 🟢 **Point vert** : Service actif et fonctionnel
- 🔴 **Point rouge** : Service arrêté ou non synchronisé
- **Pulsation** : Animation indiquant l'activité en temps réel

### Onglet Actions

![Onglet Actions](screenshots/actions-tab.png)

Actions disponibles :
- **Upload vers Mimir** : Ouvre l'interface web Mimir pour uploader des fichiers
- **Synchroniser Tous les Fichiers** : Déclenche manuellement une synchronisation complète
- **Voir les Fichiers Téléchargés** : Parcourir les fichiers locaux
- **Redémarrer le Serveur** : Redémarre le serveur Node.js
- **Effacer les Logs** : Nettoie l'historique des logs

### Onglet Configuration

![Onglet Configuration](screenshots/configuration-tab.png)

**Section Webhook URL :**
- Gestion du tunnel Cloudflare avec boutons Start/Stop
- URL du webhook pour configuration dans Mimir
- Indicateur de statut du tunnel

**Section Configuration :**
- Nom et ID du dossier
- Clé API Mimir
- Répertoire de téléchargement
- Port du serveur
- Intervalle de heartbeat

---

## Utilisation

### 1. Upload de Fichiers vers Mimir

![Processus d'upload](screenshots/upload-process.png)

1. Ouvrez le tableau de bord à http://localhost:3000
2. Allez dans l'onglet **Actions**
3. Cliquez sur **Upload vers Mimir**
4. Glissez-déposez les fichiers dans l'interface web Mimir
5. Les fichiers sont automatiquement téléchargés vers le dossier `ROSS_Images/`

### 2. Surveillance de la Synchronisation

![Logs en direct](screenshots/live-logs.png)

**Dans l'onglet Monitor :**
- **Logs en Direct** : Visualisez les événements webhook et les opérations sur fichiers en temps réel
- **Statut Webhook Mimir** :
  - 🟢 **Synced** : Le webhook est correctement configuré et actif
  - 🔴 **Not Synced** : Le webhook nécessite une mise à jour dans Mimir
- **Auto-scroll** : Active/désactive le défilement automatique des logs
- **Bouton Refresh** : Actualise manuellement les logs

### 3. Gestion du Serveur

**Redémarrage du serveur :**
```bash
# Arrêter le serveur en cours (Ctrl+C dans le terminal)
# Puis redémarrer :
node mimir-webhook-server.js
```

**Pour une exécution en production (avec PM2) :**
```bash
pm2 restart mimir-webhook
```

### 4. Configuration du Tunnel Cloudflare

![Gestion du tunnel](screenshots/tunnel-management.png)

Le tunnel Cloudflare permet au serveur local de recevoir des webhooks depuis Mimir :

1. Allez dans **Configuration** → **Webhook URL**
2. Cliquez sur **Start Tunnel**
3. Attendez que l'URL du tunnel s'affiche
4. Le serveur met à jour automatiquement le webhook dans Mimir

**États du tunnel :**
- 🟢 **Running** : Tunnel actif, URL affichée
- 🔴 **Stopped** : Tunnel arrêté, webhooks non accessibles

---

## Fichiers et Dossiers

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

## Dépannage

### Le serveur ne démarre pas

**Vérifier la disponibilité du port :**
```bash
lsof -i :3000
```

Si le port est utilisé :
```bash
# Arrêter le processus
lsof -ti:3000 | xargs kill

# Ou changer le port dans la configuration
```

### Le webhook ne reçoit pas les événements

1. Vérifiez les logs du serveur pour les erreurs
2. Vérifiez que le tunnel Cloudflare est actif (🟢 Running)
3. Vérifiez dans Mimir → Settings → Webhooks que l'URL correspond à l'URL du tunnel
4. Testez le endpoint de santé :
   ```bash
   curl http://localhost:3000/health
   ```

### Les fichiers ne se téléchargent pas

1. Vérifiez que la clé API est valide
2. Vérifiez que l'ID du dossier est correct
3. Vérifiez les permissions du dossier `ROSS_Images/` :
   ```bash
   ls -la ~/Mimir-ROSS-Server/ROSS_Images
   ```
4. Consultez les logs dans le tableau de bord ou :
   ```bash
   tail -f ~/Mimir-ROSS-Server/logs/mimir-ross.log
   ```

### Problèmes du tunnel Cloudflare

**Redémarrer le tunnel :**
1. Allez dans l'onglet Configuration
2. Cliquez sur **Stop Tunnel**
3. Attendez 2 secondes
4. Cliquez sur **Start Tunnel**

**Vérifier cloudflared :**
```bash
cloudflared --version
```

Si non trouvé, réinstallez :
```bash
brew install cloudflared
```

---

## Notifications Toast

![Notifications](screenshots/toast-notifications.png)

Le tableau de bord affiche des notifications toast pour les événements importants :

- ✅ **Vert (Succès)** : Opération réussie
- ❌ **Rouge (Erreur)** : Échec d'une opération
- ℹ️ **Bleu (Info)** : Information générale

Les notifications disparaissent automatiquement après 4 secondes.

---

## Support

### Logs

Consultez les logs du serveur pour des informations détaillées :

**Via le tableau de bord :**
- Onglet Monitor → Section Logs en Direct

**Via le terminal :**
```bash
tail -f ~/Mimir-ROSS-Server/logs/mimir-ross.log
```

### Problèmes Courants

| Problème | Solution |
|----------|----------|
| Port déjà utilisé | Changez le PORT dans la config ou tuez le processus avec `lsof -ti:3000 \| xargs kill` |
| Échec d'authentification API | Vérifiez la clé API dans les paramètres Mimir |
| Fichiers ne se synchronisent pas | Vérifiez l'ID du dossier et la configuration du webhook |
| Échec de connexion du tunnel | Redémarrez le serveur ou vérifiez la connexion Internet |

### Obtenir de l'Aide

Contactez votre administrateur système ou l'équipe de développement avec :
- Les logs du serveur (`logs/mimir-ross.log`)
- La configuration (sans la clé API)
- Capture d'écran du tableau de bord
- Description du problème

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

## Captures d'Écran à Ajouter

Pour compléter cette documentation, veuillez ajouter les captures d'écran suivantes dans le dossier `screenshots/` :

1. **dashboard-main.png** : Vue principale du tableau de bord
2. **monitor-tab.png** : Onglet Monitor avec statistiques
3. **actions-tab.png** : Onglet Actions avec les boutons
4. **configuration-tab.png** : Onglet Configuration
5. **upload-process.png** : Interface d'upload Mimir
6. **live-logs.png** : Section des logs en direct
7. **tunnel-management.png** : Gestion du tunnel Cloudflare
8. **toast-notifications.png** : Exemples de notifications toast

---

**Version** : 1.0 | **Date** : Novembre 2025 | **Plateforme** : macOS 10.14+
