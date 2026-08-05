---
name: deploy-lab-skill-authoring
description: Создаёт и проверяет новые skills контура DeployLab. Используй при просьбе «заведи skill для...» или изменить существующий skill. НЕ используй для завершения или проверки задачи — вместо этого используй deploy-lab-verify-before-done.
disable-model-invocation: true
---

## Instructions

1. Сформулируй одну повторяемую ответственность, trigger и явный non-trigger; не создавай skill для разовой задачи.
2. До создания выведи `name` и `description` всех skills из `.cursor/skills/`, `.claude/skills/` и `.agents/skills/`.
3. Сверь новый trigger с этим инвентарём; расширь существующий skill или сузь оба, если их различие нельзя понять по одной description.
4. Выбери kebab-case name не длиннее 64 символов и напиши frontmatter с `name`, `description` и `disable-model-invocation: true`.
5. Создай канон в `.cursor/skills/<name>/SKILL.md`, затем сделай физические checked-copy того же файла в `.claude/skills/` и `.agents/skills/`; не используй symlink или custom prompt.
6. Напиши `## Instructions` с нумерованными выполнимыми шагами; вынеси подробности в `references/` только если основной файл приближается к странице.
7. Проверь структуру валидатором, побайтную идентичность трёх копий и один обязательный trigger плюс один обязательный non-trigger по одной description.
