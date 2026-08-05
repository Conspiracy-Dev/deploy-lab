<template>
  <UiContainer as="main" class="ui-kit-fixture">
    <UiTypography variant="h1">UI kit controls</UiTypography>

    <section class="ui-kit-fixture__section" aria-labelledby="button-title">
      <UiTypography id="button-title" as="h2" variant="h4">Button</UiTypography>
      <UiButton>Start a Project</UiButton>
      <UiButton disabled>Disabled</UiButton>
    </section>

    <section class="ui-kit-fixture__section" aria-labelledby="input-title">
      <UiTypography id="input-title" as="h2" variant="h4">Input</UiTypography>
      <label for="fixture-company">Company name</label>
      <UiInput id="fixture-company" placeholder="Company name" />
      <label for="fixture-details">Project details</label>
      <UiInput id="fixture-details" multiline placeholder="Project details" />
    </section>

    <section class="ui-kit-fixture__section" aria-labelledby="checkbox-title">
      <UiTypography id="checkbox-title" as="h2" variant="h4">Checkbox</UiTypography>
      <label class="ui-kit-fixture__choice" for="fixture-consent">
        <UiCheckbox id="fixture-consent" />
        I agree to be contacted
      </label>
    </section>

    <section class="ui-kit-fixture__section" aria-labelledby="menu-title">
      <UiTypography id="menu-title" as="h2" variant="h4">Menu toggle</UiTypography>
      <div class="ui-kit-fixture__menu-states">
        <UiMenuToggle label="Open menu" />
        <UiMenuToggle :model-value="true" label="Close menu" />
      </div>
    </section>

    <UiSuccessNotice
      description="Thanks for getting in touch. Our team will review your information and respond promptly."
      title="Submitted successfully!"
    />
  </UiContainer>
</template>

<style scoped>
.ui-kit-fixture {
  display: grid;
  gap: var(--space-12);
  padding-block: var(--space-12);
}

.ui-kit-fixture__section {
  display: grid;
  justify-items: start;
  gap: var(--space-4);
}

.ui-kit-fixture__choice {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  font-family: var(--font-body);
}

.ui-kit-fixture__menu-states {
  display: flex;
  gap: var(--space-3);
}
</style>
