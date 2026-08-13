<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue'
import {
  contactAcceptedResponseSchema,
  contactInvalidRequestResponseSchema,
  contactRequestSchema,
  getInvalidContactFields,
  type ContactField,
} from '#shared/contracts/contact-request'
import { homeAnchorIds, homeContent } from './home.config'

type ContactFormField = Exclude<ContactField, 'website'>
type ContactFormState = 'idle' | 'submitting' | 'success' | 'error'

interface ContactFormValues {
  consent: boolean
  email: string
  message: string
  name: string
  website: string
}

const FIELD_VALIDATION_MESSAGES: Record<ContactFormField, string> = {
  consent: homeContent.contact.consentValidationMessage,
  email: homeContent.contact.emailValidationMessage,
  message: homeContent.contact.messageValidationMessage,
  name: homeContent.contact.nameValidationMessage,
}
const FORM_FIELD_ORDER: readonly ContactFormField[] = ['name', 'email', 'message', 'consent']

const formValues = reactive<ContactFormValues>({
  consent: false,
  email: '',
  message: '',
  name: '',
  website: '',
})
const formState = ref<ContactFormState>('idle')
const fieldErrors = ref<Partial<Record<ContactFormField, string>>>({})

function getFieldErrorId(field: ContactFormField): string | undefined {
  return fieldErrors.value[field] ? `contact-${field}-error` : undefined
}

function getResponseData(error: unknown): unknown {
  if (typeof error !== 'object' || error === null || !('data' in error)) {
    return undefined
  }

  return error.data
}

function resetForm() {
  formValues.consent = false
  formValues.email = ''
  formValues.message = ''
  formValues.name = ''
  formValues.website = ''
  fieldErrors.value = {}
}

function resetForNewRequest() {
  formState.value = 'idle'
  scheduleFocus('name')
}

function setInvalidFields(fields: readonly ContactField[]) {
  fieldErrors.value = Object.fromEntries(
    fields
      .filter((field): field is ContactFormField => field !== 'website')
      .map((field) => [field, FIELD_VALIDATION_MESSAGES[field]]),
  )

  const firstInvalidField = FORM_FIELD_ORDER.find((field) => fields.includes(field))

  if (firstInvalidField) {
    scheduleFocus(firstInvalidField)
  }
}

function scheduleFocus(field: ContactFormField) {
  void nextTick(() => setTimeout(() => focusField(field)))
}

function focusField(field: ContactFormField) {
  document.getElementById(`contact-${field}`)?.focus()
}

function validateForm(): boolean {
  const result = contactRequestSchema.safeParse(formValues)

  if (result.success) {
    return true
  }

  setInvalidFields(getInvalidContactFields(result.error))
  return false
}

async function submitForm() {
  if (formState.value === 'submitting') {
    return
  }

  fieldErrors.value = {}

  if (!validateForm()) {
    return
  }

  formState.value = 'submitting'

  try {
    const response = await $fetch('/api/contact', {
      body: { ...formValues },
      method: 'POST',
    })

    if (contactAcceptedResponseSchema.safeParse(response).success) {
      resetForm()
      formState.value = 'success'
      return
    }

    formState.value = 'error'
  } catch (error: unknown) {
    const responseData = getResponseData(error)
    const invalidResponse = contactInvalidRequestResponseSchema.safeParse(responseData)

    if (invalidResponse.success) {
      setInvalidFields(invalidResponse.data.fields)
      formState.value = 'idle'
      return
    }

    formState.value = 'error'
  }
}
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

      <div v-if="formState === 'success'" class="home-contact__success">
        <UiSuccessNotice
          :description="homeContent.contact.successDescription"
          :title="homeContent.contact.successTitle"
        />
        <UiButton type="button" @click="resetForNewRequest">
          {{ homeContent.contact.startNewRequestLabel }}
        </UiButton>
      </div>

      <form class="home-contact__form" novalidate @submit.prevent="submitForm">
        <div class="home-contact__fields">
          <div class="home-contact__field">
            <label class="sr-only" for="contact-name">{{ homeContent.contact.nameLabel }}</label>
            <UiInput
              id="contact-name"
              v-model="formValues.name"
              :aria-describedby="getFieldErrorId('name')"
              :aria-invalid="Boolean(fieldErrors.name)"
              :disabled="formState === 'submitting'"
              autocomplete="name"
              name="name"
              :placeholder="homeContent.contact.nameLabel"
              required
            />
            <p
              v-if="fieldErrors.name"
              :id="getFieldErrorId('name')"
              class="home-contact__field-error"
            >
              {{ fieldErrors.name }}
            </p>
          </div>
          <div class="home-contact__field">
            <label class="sr-only" for="contact-email">{{ homeContent.contact.emailLabel }}</label>
            <UiInput
              id="contact-email"
              v-model="formValues.email"
              :aria-describedby="getFieldErrorId('email')"
              :aria-invalid="Boolean(fieldErrors.email)"
              :disabled="formState === 'submitting'"
              autocomplete="email"
              name="email"
              :placeholder="homeContent.contact.emailLabel"
              required
              type="email"
            />
            <p
              v-if="fieldErrors.email"
              :id="getFieldErrorId('email')"
              class="home-contact__field-error"
            >
              {{ fieldErrors.email }}
            </p>
          </div>
          <div class="home-contact__field home-contact__field--message">
            <label class="sr-only" for="contact-message">{{
              homeContent.contact.messageLabel
            }}</label>
            <UiInput
              id="contact-message"
              v-model="formValues.message"
              :aria-describedby="getFieldErrorId('message')"
              :aria-invalid="Boolean(fieldErrors.message)"
              :disabled="formState === 'submitting'"
              multiline
              name="message"
              :placeholder="homeContent.contact.messageLabel"
              required
              :rows="4"
            />
            <p
              v-if="fieldErrors.message"
              :id="getFieldErrorId('message')"
              class="home-contact__field-error"
            >
              {{ fieldErrors.message }}
            </p>
          </div>
        </div>

        <div class="home-contact__actions">
          <div class="home-contact__consent">
            <UiCheckbox
              id="contact-consent"
              v-model="formValues.consent"
              :aria-describedby="getFieldErrorId('consent')"
              :aria-invalid="Boolean(fieldErrors.consent)"
              :disabled="formState === 'submitting'"
              name="consent"
              required
            />
            <span id="contact-consent-label">
              <label class="sr-only" for="contact-consent">
                {{ homeContent.contact.consentPrefix }}{{ homeContent.contact.privacyLabel }}
              </label>
              <span aria-hidden="true">{{ homeContent.contact.consentPrefix }}</span>
              <a :href="homeContent.privacyHref">{{ homeContent.contact.privacyLabel }}</a>
              <span aria-hidden="true">{{ homeContent.contact.consentSuffix }}</span>
            </span>
            <p
              v-if="fieldErrors.consent"
              :id="getFieldErrorId('consent')"
              class="home-contact__field-error"
            >
              {{ fieldErrors.consent }}
            </p>
          </div>
          <UiButton
            :aria-busy="formState === 'submitting'"
            :disabled="formState === 'submitting'"
            type="submit"
          >
            {{
              formState === 'submitting'
                ? homeContent.contact.sendingLabel
                : homeContent.contact.actionLabel
            }}
          </UiButton>
        </div>

        <p v-if="formState === 'error'" class="home-contact__form-error" role="alert">
          {{ homeContent.contact.errorMessage }}
        </p>

        <UiInput
          v-model="formValues.website"
          aria-hidden="true"
          autocomplete="off"
          class="home-contact__honeypot"
          :disabled="formState === 'submitting'"
          name="website"
          tabindex="-1"
        />
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
  min-width: 0;
}

.home-contact__field-error,
.home-contact__form-error {
  margin: var(--space-2) 0 0;
  color: var(--color-text);
  font-size: var(--font-size-body-mobile);
  line-height: var(--line-height-body);
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
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  column-gap: var(--space-2);
  color: rgb(255 255 255 / 50%);
  font-family: var(--font-body);
  font-size: var(--font-size-body-mobile);
  line-height: var(--line-height-body);
}

.home-contact__consent .home-contact__field-error {
  grid-column: 1 / -1;
  color: var(--color-text);
}

.home-contact__consent a {
  color: inherit;
}

.home-contact__consent a:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.home-contact__success {
  display: grid;
  justify-items: center;
  gap: var(--space-6);
}

.home-contact__success :deep(.ui-button) {
  inline-size: 100%;
}

.home-contact__honeypot {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
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

  .home-contact__success :deep(.ui-button) {
    inline-size: auto;
  }
}
</style>
