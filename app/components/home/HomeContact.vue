<script setup lang="ts">
import { ref } from 'vue'
import { homeAnchorIds, homeContent } from './home.config'

const name = ref('')
const email = ref('')
const message = ref('')
const consent = ref(false)
</script>

<template>
  <section :id="homeAnchorIds.contact" class="home-contact" aria-labelledby="contact-title">
    <UiContainer class="home-contact__container">
      <div class="home-contact__intro">
        <UiTypography id="contact-title" as="h2" variant="h3">
          {{ homeContent.contact.title }}
        </UiTypography>
        <UiTypography variant="body">{{ homeContent.contact.description }}</UiTypography>
      </div>

      <form class="home-contact__form" novalidate>
        <div class="home-contact__fields">
          <label class="home-contact__field" for="contact-name">
            <span class="sr-only">{{ homeContent.contact.nameLabel }}</span>
            <UiInput
              id="contact-name"
              v-model="name"
              autocomplete="name"
              name="name"
              :placeholder="homeContent.contact.nameLabel"
            />
          </label>
          <label class="home-contact__field" for="contact-email">
            <span class="sr-only">{{ homeContent.contact.emailLabel }}</span>
            <UiInput
              id="contact-email"
              v-model="email"
              autocomplete="email"
              name="email"
              :placeholder="homeContent.contact.emailLabel"
              type="email"
            />
          </label>
          <label class="home-contact__field home-contact__field--message" for="contact-message">
            <span class="sr-only">{{ homeContent.contact.messageLabel }}</span>
            <UiInput
              id="contact-message"
              v-model="message"
              multiline
              name="message"
              :placeholder="homeContent.contact.messageLabel"
              :rows="4"
            />
          </label>
        </div>

        <div class="home-contact__actions">
          <label class="home-contact__consent" for="contact-consent">
            <UiCheckbox
              id="contact-consent"
              v-model="consent"
              aria-label="I agree to the Privacy Policy."
              name="consent"
            />
            <span id="contact-consent-label">
              {{ homeContent.contact.consentPrefix }}
              <a :href="homeContent.privacyHref">{{ homeContent.contact.privacyLabel }}</a
              >{{ homeContent.contact.consentSuffix }}
            </span>
          </label>
          <UiButton type="button">{{ homeContent.contact.actionLabel }}</UiButton>
        </div>
      </form>
    </UiContainer>
  </section>
</template>

<style scoped>
.home-contact {
  padding-block: 5rem;
  background: var(--color-surface);
}

.home-contact__container {
  display: grid;
  gap: 2.5rem;
}

.home-contact__intro {
  display: grid;
  gap: 1.25rem;
}

.home-contact__form,
.home-contact__fields {
  display: grid;
  gap: 1.25rem;
}

.home-contact__field {
  display: block;
}

.home-contact :deep(textarea.ui-input) {
  min-block-size: 8.75rem;
}

.home-contact__field--message :deep(.ui-input) {
  max-inline-size: none;
}

.home-contact :deep(.ui-input:focus-visible),
.home-contact :deep(.ui-checkbox:focus-visible),
.home-contact :deep(.ui-button:focus-visible) {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.home-contact__actions {
  display: grid;
  gap: 1rem;
}

.home-contact__consent {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: rgb(255 255 255 / 50%);
  font-family: var(--font-body);
  font-size: var(--font-size-body-mobile);
  line-height: var(--line-height-body);
}

.home-contact__consent a {
  color: inherit;
}

.home-contact__consent a:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

@media (width >= 64rem) {
  .home-contact {
    padding-block: 4rem;
    background: var(--color-control-surface);
  }

  .home-contact__container {
    gap: 2.5rem;
    padding: 3.75rem;
    background: var(--color-surface);
  }

  .home-contact__intro {
    gap: 1rem;
  }

  .home-contact__fields {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem 1.25rem;
  }

  .home-contact__field--message {
    grid-column: 1 / -1;
  }

  .home-contact__actions {
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 1.25rem;
  }
}
</style>
