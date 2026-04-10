const { Vault, VAULT_MAX_BLOB_BYTES } = require('../models/Vault');

async function getVault(req, res) {
  try {
    const vault = await Vault.findByUserId(req.user.id);
    if (!vault) {
      return res.status(404).json({ error: 'Aucun vault trouvé pour cet utilisateur' });
    }

    res.json({
      vault: {
        revision: vault.revision,
        blob: vault.blob,
        kdf: vault.kdf ? JSON.parse(vault.kdf) : null,
        wrappedKeyMaster: vault.wrapped_key_master,
        wrappedKeyRecovery: vault.wrapped_key_recovery,
        metadata: vault.metadata ? JSON.parse(vault.metadata) : null,
        updatedAt: vault.updated_at
      }
    });
  } catch (err) {
    console.error('getVault error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération du vault' });
  }
}

async function updateVault(req, res) {
  try {
    const { baseRevision, blob, kdf, wrappedKeyMaster, wrappedKeyRecovery, metadata } = req.body;

    if (!blob || typeof blob !== 'string') {
      return res.status(400).json({ error: 'Le champ blob est requis (base64 string)' });
    }

    if (Buffer.byteLength(blob, 'utf8') > VAULT_MAX_BLOB_BYTES) {
      return res.status(413).json({ error: `Le vault dépasse la taille maximale autorisée (${Math.round(VAULT_MAX_BLOB_BYTES / 1024 / 1024)} MB)` });
    }

    const userId = req.user.id;
    const existing = await Vault.findByUserId(userId);

    const currentRevision = existing ? existing.revision : 0;

    // Optimistic concurrency check
    if (baseRevision !== currentRevision) {
      return res.status(409).json({
        error: 'Conflit de révision : le vault a été modifié entre-temps',
        currentRevision,
        updatedAt: existing ? existing.updated_at : null
      });
    }

    const newRevision = currentRevision + 1;

    // Save new version in history before updating
    const updatedVault = await Vault.upsert({ userId, blob, kdf, wrappedKeyMaster, wrappedKeyRecovery, metadata, newRevision });

    await Vault.saveVersion({
      vaultId: updatedVault.id,
      userId,
      blob,
      kdf,
      wrappedKeyMaster,
      wrappedKeyRecovery,
      metadata,
      revision: newRevision
    });

    res.json({
      message: 'Vault mis à jour avec succès',
      vault: {
        revision: updatedVault.revision,
        updatedAt: updatedVault.updated_at
      }
    });
  } catch (err) {
    console.error('updateVault error:', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du vault' });
  }
}

async function getVaultHistory(req, res) {
  try {
    const versions = await Vault.getHistory(req.user.id);

    res.json({
      history: versions.map(v => ({
        id: v.id,
        revision: v.revision,
        size: v.size,
        kdf: v.kdf ? JSON.parse(v.kdf) : null,
        wrappedKeyMaster: v.wrapped_key_master,
        wrappedKeyRecovery: v.wrapped_key_recovery,
        metadata: v.metadata ? JSON.parse(v.metadata) : null,
        createdAt: v.created_at
      }))
    });
  } catch (err) {
    console.error('getVaultHistory error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
}

async function getVaultVersion(req, res) {
  try {
    const versionId = parseInt(req.params.versionId, 10);
    if (!versionId || isNaN(versionId)) {
      return res.status(400).json({ error: 'ID de version invalide' });
    }

    const version = await Vault.getVersion(req.user.id, versionId);
    if (!version) {
      return res.status(404).json({ error: 'Version non trouvée' });
    }

    res.json({
      version: {
        id: version.id,
        revision: version.revision,
        blob: version.blob,
        kdf: version.kdf ? JSON.parse(version.kdf) : null,
        wrappedKeyMaster: version.wrapped_key_master,
        wrappedKeyRecovery: version.wrapped_key_recovery,
        metadata: version.metadata ? JSON.parse(version.metadata) : null,
        size: version.size,
        createdAt: version.created_at
      }
    });
  } catch (err) {
    console.error('getVaultVersion error:', err);
    res.status(500).json({ error: 'Erreur lors de la récupération de la version' });
  }
}

module.exports = { getVault, updateVault, getVaultHistory, getVaultVersion };
