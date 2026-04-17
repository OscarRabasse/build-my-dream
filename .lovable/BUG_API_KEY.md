# Bug : synthèse Claude Haiku échoue en production (Lovable/Cloudflare)

**Statut : ✅ RÉSOLU le 2026-04-15 (session soir/nuit).** Fix final = désactiver "Authenticated Gateway" dans le dashboard Cloudflare AI Gateway. Cause racine = 403 géoIP Anthropic sur le path Worker Lovable → edge CF Anthropic, contourné en routant via Cloudflare AI Gateway (commit `0679f10`). Le blocage final a été un 401 du gateway lui-même parce que l'auth gateway était activée par défaut — ne demandant que la clé Anthropic passthrough, suffisait de l'éteindre côté dashboard. Verdict Claude en français confirmé visible sur `build-my-dream-224.lovable.app` par Oscar.

**Fichiers concernés :**
- [src/utils/analyze.functions.ts:760-762](../src/utils/analyze.functions.ts#L760-L762) — `synthesize()` lit maintenant `process.env.ANTHROPIC_GATEWAY_URL` avec fallback sur l'API Anthropic directe
- [wrangler.jsonc](../wrangler.jsonc) — contient toujours `placement.mode: "smart"` mais **Lovable ignore ce fichier** (voir plus bas) ; le laisser ou le retirer est sans effet

---

## Symptôme

En production (site déployé via Lovable sur Cloudflare Workers), la synthèse Claude Haiku renvoie systématiquement `"Synthèse indisponible."` au lieu du verdict français attendu. Les 8 checks Firecrawl s'exécutent correctement — seul l'appel à `api.anthropic.com` échoue.

Erreur exacte retournée par Anthropic en prod :
```json
{
  "error": {
    "type": "forbidden",
    "message": "Request not allowed"
  }
}
```
Status HTTP : **403**. `cf-ray` dans la réponse : `...−HKG` (edge Hong Kong côté Anthropic — **pas** côté Worker, voir clarification section suivante).

---

## Cause réelle identifiée (session du 2026-04-15 soir)

Diagnostic affiné après deux sessions successives :

### 1. Lovable ignore `wrangler.jsonc` au déploiement (confirmé le 2026-04-15 soir)

Lovable a inspecté directement les headers de réponse du site live (`build-my-dream-224.lovable.app`) :

```
cf-ray: 9eca4a728dcbad76-PDX
x-deployment-id: de63bd04...
cf-placement: [ABSENT]
```

Le header `cf-placement` est absent → **Smart Placement n'est PAS actif** malgré la présence de `placement.mode: "smart"` dans notre `wrangler.jsonc`. Lovable a leur propre pipeline Cloudflare Workers et regénère leur config wrangler au déploiement ; le `wrangler.jsonc` de notre repo est cosmétique et n'arrive jamais jusqu'à Cloudflare. Conclusion : on ne peut pas changer le routing du Worker via ce fichier, ni y ajouter de bindings / routes / placement custom. Toute config Worker custom doit passer par du code applicatif ou un proxy externe.

### 2. Clarification sur le suffixe `cf-ray` (ce qu'on croyait et ce qui est vrai)

**Ce qu'on croyait (session du 2026-04-15 matin)** : le Worker Lovable tournait depuis HKG et sortait par ce POP non-supporté par Anthropic.

**La vraie interprétation** : le `cf-ray=...-HKG` qu'on voyait dans les logs `[SYNTHESIS_ERROR]` n'est **pas** celui de notre Worker — c'est celui de l'edge Cloudflare d'Anthropic (`api.anthropic.com` est hébergé sur Cloudflare, donc renvoie son propre `cf-ray` dans la réponse HTTP). Le Worker Lovable tourne en réalité depuis PDX (Portland, US) — vérifié par les headers directs du site live.

**Ce qui se passe vraiment** : quand le Worker Lovable (en PDX) appelle `api.anthropic.com`, le routage Cloudflare-interne (Worker → `api.anthropic.com`) hop via leur edge HKG pour des raisons obscures (probablement le path Argo le plus court vers les backends LLM d'Anthropic). Anthropic voit la requête arriver depuis leur propre edge HKG et déclenche un blocage géoIP → `403 "Request not allowed"`. Ce n'est pas sous notre contrôle via `wrangler.jsonc`, et c'est pourquoi Smart Placement n'aurait de toute façon rien changé (le Worker est déjà en PDX, pas en HKG).

### 3. La clé Anthropic n'est pas le problème

Un diagnostic parallèle de Lovable (basé sur les logs `[SYNTHESIS_ERROR]`) a suggéré que la clé stockée dans `ANTHROPIC_API_KEY` était invalide parce que le suffixe visible dans les logs était `…0AAA`. **C'est faux** : ce suffixe correspond bien à la nouvelle clé qu'Oscar a installée (confirmé par lui). Le test curl local avec cette même clé renvoie HTTP 200 — elle est valide côté Anthropic.

Leçon : le 403 `"Request not allowed"` d'Anthropic est **ambigu** — il est renvoyé aussi bien pour une clé invalide que pour un blocage géoIP. Sans regarder la géographie effective du Worker, on ne peut pas trancher. Ne pas rotater la clé tant que le fix géographique (AI Gateway) n'est pas validé.

---

## Fix déployé (Plan B : Cloudflare AI Gateway)

### Pourquoi AI Gateway

Cloudflare **AI Gateway** est un service officiel Cloudflare conçu exactement pour ce cas : servir de proxy entre Workers et providers LLM via un endpoint dédié (`gateway.ai.cloudflare.com`) qui garantit un routage compatible avec les providers (pas de hop via POP non-supportés).

Avantages :
- Pas besoin de toucher à `wrangler.jsonc` (que Lovable ignore de toute façon) — il suffit de changer l'URL cible du `fetch()` dans le code applicatif.
- Passthrough transparent : le header `x-api-key` reste identique, le body reste identique, la réponse reste identique.
- Bonus : dashboard de monitoring Cloudflare (nombre d'appels, coûts, latence, erreurs) — utile quand l'outil attirera du trafic LinkedIn.
- Caching optionnel et rate limiting par clé disponibles si besoin plus tard.

### Infrastructure créée par Oscar (2026-04-15 soir)

- **Compte Cloudflare** : créé avec `oscar@pixweb.fr`, free plan, pas de domaine ajouté
- **Account ID** : `3bf0000cd70edba1736fc57d64c3a193`
- **Gateway** : nommé `ai-readability`
- **URL du gateway Anthropic** :
  ```
  https://gateway.ai.cloudflare.com/v1/3bf0000cd70edba1736fc57d64c3a193/ai-readability/anthropic/v1/messages
  ```

### Modification de code (commit `0679f10`)

Dans [src/utils/analyze.functions.ts:760-762](../src/utils/analyze.functions.ts#L760-L762), la fonction `synthesize()` lit maintenant l'URL via `process.env.ANTHROPIC_GATEWAY_URL` avec fallback sur l'API Anthropic directe :

```ts
try {
  const anthropicUrl =
    process.env.ANTHROPIC_GATEWAY_URL ?? "https://api.anthropic.com/v1/messages";
  const res = await fetch(anthropicUrl, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      ...
```

**Rationale de l'env var (plutôt que hard-code)** :
- Le dev local continue à marcher sans créer de gateway (fallback sur l'API directe). Pas de dépendance au gateway pour bosser en local.
- La prod Lovable utilise le gateway via le secret `ANTHROPIC_GATEWAY_URL` ajouté côté Lovable.
- Désactivation possible sans toucher au code (retirer le secret côté Lovable).

**Commit** : `0679f10` "Route Anthropic calls through Cloudflare AI Gateway when ANTHROPIC_GATEWAY_URL is set". Pushé sur `origin/main` avec l'accord explicite d'Oscar.

---

## État actuel et prochaines étapes (pour l'agent suivant)

### ✅ Déjà fait

1. Compte Cloudflare créé (Oscar)
2. Gateway AI Gateway `ai-readability` créé (Oscar)
3. URL du gateway construite et vérifiée
4. Code modifié et committé (commit `0679f10`)
5. Push sur `origin/main`

### ⏳ À faire par Oscar (Phase 3)

1. **Ajouter le secret dans Lovable** :
   - Nom : `ANTHROPIC_GATEWAY_URL`
   - Valeur : `https://gateway.ai.cloudflare.com/v1/3bf0000cd70edba1736fc57d64c3a193/ai-readability/anthropic/v1/messages`
2. **Publier** : clic "Publish → Update" dans l'UI Lovable (Lovable ne déploie pas automatiquement sur git push)
3. **Tester** une analyse sur `build-my-dream-224.lovable.app`

### ⏳ À vérifier par l'agent suivant (Phase 4)

Oscar rapportera les résultats du test. Trois scénarios possibles :

| Observation | Interprétation | Action |
|---|---|---|
| Verdict Claude affiché en français (2-3 phrases) | ✅ Fix validé | Fermer le bug. Mettre à jour ce fichier avec le statut "résolu". Optionnel : retirer `placement.mode: smart` de `wrangler.jsonc` pour éviter la confusion future (sans effet puisque Lovable l'ignore). |
| Toujours "Synthèse indisponible." | Échec — demander les nouveaux logs à Lovable | Voir "Demande à faire à Lovable" ci-dessous |
| Nouvelle erreur différente (500, timeout, etc.) | AI Gateway mal configuré ou URL fausse | Vérifier le secret Lovable, vérifier l'URL (le suffixe `/anthropic/v1/messages` est souvent oublié) |

### Demande à faire à Lovable en cas d'échec

> *"Peux-tu me donner les 3 derniers logs `[SYNTHESIS]` ou `[SYNTHESIS_ERROR]` ? Je veux voir le `status=` et le `cfRay=`. Et vérifier que le `fetch()` cible bien l'URL `gateway.ai.cloudflare.com/...` et pas `api.anthropic.com` directement. Peux-tu aussi confirmer que le secret `ANTHROPIC_GATEWAY_URL` est bien présent dans les env vars du déploiement actuel ?"*

Interprétations possibles des réponses :
- **`status=200`** → fix validé, quelque chose côté cache client
- **`status=403` via `gateway.ai.cloudflare.com`** → URL gateway mal formée (vérifier suffixe `/anthropic/v1/messages`) ou clé Anthropic effectivement invalide (comparer avec la valeur dans `.dev.vars`)
- **`status=403` via `api.anthropic.com`** → le secret `ANTHROPIC_GATEWAY_URL` n'est pas pris en compte (Oscar l'a peut-être oublié, ou Lovable ne l'a pas propagé au build — demander une nouvelle publish)
- **Erreur 404 sur gateway** → URL incorrecte, demander à Oscar de re-vérifier le dashboard Cloudflare

---

## Hypothèses écartées (pour archive)

| Hypothèse | Statut | Pourquoi écartée |
|---|---|---|
| Mismatch de clé API | ❌ | Vérifié par Oscar : le suffixe `…0AAA` dans les logs Lovable correspond bien à la nouvelle clé installée |
| Clé invalide / expirée | ❌ | Curl local HTTP 200 avec la même clé |
| Mauvais model ID | ❌ | Bien sur `claude-haiku-4-5-20251001` |
| Déploiement pas à jour | ❌ | Lovable a confirmé le 2026-04-15 soir : "Codebase synchronisé avec GitHub" |
| Header `user-agent` custom bloqué par Anthropic WAF | ❌ | Hypothèse testée via commit `d514b31`, aucune amélioration. Le 403 est du géoIP, pas du WAF. |
| Restriction IP sur la clé | ❌ | Écarté par test curl direct |
| IPs Cloudflare Workers bloquées globalement | ❌ | Les fetch Firecrawl depuis le même runtime passent |
| Worker Lovable sort depuis HKG | ❌ | Faux — le Worker est en PDX. Le `cf-ray=...-HKG` qu'on voyait venait de l'edge Anthropic, pas du Worker. |
| Smart Placement via `wrangler.jsonc` | ❌ | Lovable ignore `wrangler.jsonc` (confirmé le 2026-04-15 soir, header `cf-placement` absent) |

---

## Ce qui a déjà été tenté (archive complète)

1. **Logging amélioré** dans `synthesize()` — [lignes 774-785](../src/utils/analyze.functions.ts#L774-L785) — capture status HTTP, type d'erreur, message, empreinte de clé, longueur, et `cf-ray`. ✅
2. **Model ID vérifié** — [ligne 770](../src/utils/analyze.functions.ts#L770) — bien sur `claude-haiku-4-5-20251001`. ✅
3. **Test curl local** — clé confirmée valide (HTTP 200). ✅
4. **Vérification fingerprint clé** — nouvelle clé `…0AAA` confirmée correcte côté Oscar. ✅
5. **Ajout d'un `user-agent` custom** (commit `d514b31`) — hypothèse WAF Anthropic. ❌ Aucune amélioration.
6. **Activation de Smart Placement dans wrangler.jsonc** (commit `baa357c`) — hypothèse géoIP HKG. ❌ Lovable ignore le fichier, header `cf-placement` absent à la vérif.
7. **Route via Cloudflare AI Gateway** (commit `0679f10`) — en attente de validation post-publish Lovable par Oscar. ⏳

---

## Pièges à éviter pour le prochain agent

- **Ne PAS toucher à la clé Anthropic.** Elle est valide (curl local HTTP 200) et correcte côté Lovable (`…0AAA` = nouvelle clé d'Oscar). Le problème n'est pas là et n'a jamais été là.
- **Ne PAS interpréter `cf-ray=...-HKG` comme une preuve que le Worker est en HKG.** C'est l'edge Cloudflare d'Anthropic (`api.anthropic.com` est sur Cloudflare). Le Worker Lovable tourne en PDX.
- **Vérifier l'état git avant de diagnostiquer** (`git status` + `git diff` + `git log`). Une session précédente a introduit un diff non-committé sur `analyze.functions.ts` qui a désynchronisé le local de la prod.
- **Ne pas pusher sans demander explicitement** à Oscar (règle projet).
- **Ne pas modifier `vite.config.ts`** — géré par Lovable via `@lovable.dev/vite-tanstack-config`.
- **Ne pas modifier `wrangler.jsonc`** en comptant sur un effet en prod — Lovable l'ignore entièrement. Tout besoin de config Worker custom doit passer par du code applicatif ou un proxy externe.
- **Ne jamais committer `.dev.vars`** — gitignored pour une raison.
- **Ne pas ajouter `ANTHROPIC_GATEWAY_URL` au `.dev.vars`** — en local, on veut que le fallback sur l'API directe prenne le relais pour ne pas dépendre du gateway en dev.
- **Ne pas changer le nom du secret** — Lovable reconnaît `ANTHROPIC_API_KEY` et maintenant aussi `ANTHROPIC_GATEWAY_URL` ; ne pas inventer de nouveaux noms.
- **Oscar est non-technique** — lui demander explicitement de copier-coller les valeurs, ne pas supposer qu'il sait naviguer dans les dashboards Cloudflare ou Lovable.
- **Lovable ne republie pas automatiquement sur git push** — toujours rappeler à Oscar de cliquer "Publish → Update".
- **Ne PAS signaler ce bug comme résolu avant d'avoir vu le verdict s'afficher dans l'UI** (pas juste "le site ne crash plus"). Demander confirmation visuelle à Oscar.

---

## Sources utiles

- [Cloudflare AI Gateway — Anthropic provider](https://developers.cloudflare.com/ai-gateway/providers/anthropic/)
- [Cloudflare AI Gateway — Getting started](https://developers.cloudflare.com/ai-gateway/get-started/)
- [Anthropic — Supported countries](https://www.anthropic.com/supported-countries)
- [Cloudflare Workers — Smart Placement docs](https://developers.cloudflare.com/workers/configuration/smart-placement/) (désormais non pertinent pour ce bug, Lovable ignore wrangler.jsonc)
- [Lovable — Publish feature](https://docs.lovable.dev/features/publish)
- Cloudflare Community : "AI Gateway routes to restricted regions causing API blocks"

---

## Historique

- Session **2026-04-14** : hypothèses clé / model ID / user-agent WAF. Voir [plan.md](plan.md).
- Session **2026-04-15 (matin)** : diagnostic approfondi, découverte `cfRay=...-HKG`, logging `[SYNTHESIS_ERROR]` enrichi, hypothèse géoIP HKG du Worker.
- Session **2026-04-15 (après-midi)** : fix Smart Placement tenté (commit `baa357c`), push sur `main`. Attente du republish Lovable.
- Session **2026-04-15 (soir)** :
  - Lovable confirme via inspection des headers que `wrangler.jsonc` est ignoré (header `cf-placement` absent, Worker en PDX pas en HKG).
  - Clarification : le `cf-ray=...-HKG` des logs `[SYNTHESIS_ERROR]` est l'edge Anthropic, pas celui du Worker.
  - Clarification : le suffixe de clé `…0AAA` est la nouvelle clé d'Oscar, donc valide.
  - Décision : abandon de Smart Placement, bascule sur Cloudflare AI Gateway.
  - Oscar crée son compte Cloudflare + le gateway `ai-readability` (Account ID `3bf0000cd70edba1736fc57d64c3a193`).
  - Claude Code modifie `synthesize()` pour lire `process.env.ANTHROPIC_GATEWAY_URL` avec fallback.
  - Commit `0679f10` créé et pushé sur `origin/main` avec l'accord d'Oscar.
  - Oscar ajoute le secret `ANTHROPIC_GATEWAY_URL` dans Lovable et publie.
- Session **2026-04-15 (nuit) — résolution finale** :
  - Test post-publish : toujours `"Synthèse indisponible."`.
  - Nouveaux logs Lovable demandés : `status=401`, `cfRay=...-HKG`, erreur `{"code":2009,"message":"Unauthorized"}` au **format Cloudflare Gateway** (pas Anthropic). Preuve que le `fetch()` atteint bien le gateway — le secret `ANTHROPIC_GATEWAY_URL` est injecté correctement.
  - Diagnostic : le gateway `ai-readability` avait **"Authenticated Gateway" activé par défaut** côté dashboard Cloudflare. Cette option fait que le gateway exige un header `cf-aig-authorization` avec un token Cloudflare propre **en plus** du `x-api-key` Anthropic du passthrough. Sans ce header → rejet 401 avant même le passthrough Anthropic.
  - Fix : Oscar désactive l'option "Authenticated Gateway" dans le dashboard Cloudflare (onglet Settings du gateway). **Aucune modification de code nécessaire** — le commit `0679f10` était déjà correct.
  - Test final : verdict Claude en français (2-3 phrases) s'affiche correctement sur `build-my-dream-224.lovable.app`. ✅
  - Note : `cf-ray=...-HKG` dans les logs 401 était l'edge Cloudflare qui héberge le gateway lui-même (pas Anthropic, pas le Worker) — interprétation encore piégeuse mais cette fois sans impact.

---

## Leçons pour le prochain agent (si un bug similaire réapparaît)

1. **Quand tu crées un AI Gateway Cloudflare, vérifie le réglage "Authenticated Gateway" dans Settings** — il peut être activé par défaut selon comment le gateway est créé, et ça bloque silencieusement avec un 401 au format CF Gateway.
2. **Distinguer format d'erreur Anthropic vs format Cloudflare Gateway** est le raccourci diagnostic clé pour savoir *où* dans la chaîne ça casse :
   - Format `{"error":{"type":"...","message":"..."}}` → réponse Anthropic (le gateway a passé le passthrough)
   - Format `{"code":NNNN,"message":"..."}` ou `{"success":false,"result":...,"errors":[...]}` → réponse Cloudflare Gateway (le gateway a rejeté avant le passthrough)
3. **Le `cf-ray=...-HKG`** peut venir de 3 endroits différents selon où on est dans la chaîne : edge Anthropic, edge Cloudflare Gateway, ou edge Worker Lovable. Toujours croiser avec le format du body de réponse pour trancher.
4. **Les logs `[SYNTHESIS_ERROR]` actuels** ([analyze.functions.ts:785-787](../src/utils/analyze.functions.ts#L785-L787)) capturent déjà status + type + msg + cfRay + body complet — c'est suffisant pour diagnostiquer cette classe de bugs. Ne pas alléger ce logging.
