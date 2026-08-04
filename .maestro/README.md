# E2E flows (Maestro)

These flows need a real device or emulator/simulator — they can't run in this
dev sandbox, which has neither. To run them yourself:

1. Install the Maestro CLI: https://docs.maestro.dev/getting-started/installing-maestro
2. Build a debug client and get it running on an emulator/simulator/device:
   ```bash
   npx expo run:android   # or: npx expo run:ios
   ```
3. Run a flow against the running app:
   ```bash
   maestro test .maestro/complete-daily-quests.yaml
   maestro test .maestro/navigate-domain-detail.yaml
   ```

`complete-daily-quests.yaml` is the PLAN.md Batch 6 gate: complete all 5
quests in a day and confirm the progress summary updates. See the comments
in that file for why it doesn't (and can't, in one run) assert a level-up —
that's covered by the Jest integration test instead.
