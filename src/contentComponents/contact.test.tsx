/// <reference types="vitest/import-meta" />
import { describe, expect, it, vi } from "vitest"
import { render } from "@testing-library/react"
import i18next from "i18next"
import { I18nextProvider, initReactI18next } from "react-i18next"
import Contact from "./contact"
import en from "../../public/locales/en/translation.json"

// Mock react-cool-inview (IntersectionObserver not available in jsdom)
vi.mock("react-cool-inview", () => ({
  useInView: () => ({ observe: () => {} }),
}))

vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "test-site-key")
vi.stubEnv("VITE_API_URL", "http://localhost:3001/api")

// Sync standalone i18n instance: HttpBackend + language detection need a real
// browser and would otherwise suspend useTranslation() in jsdom forever.
const i18n = i18next.createInstance()
i18n.use(initReactI18next).init({
  lng: "en",
  fallbackLng: "en",
  resources: { en: { translation: en } },
  react: { useSuspense: false },
})

describe("contact form submission", () => {
  it("mounts without crashing and renders the contact form", () => {
    expect(typeof Contact).toBe("function")
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <Contact />
      </I18nextProvider>
    )
    // Verify key elements are present
    expect(container.querySelector("section")).not.toBeNull()
    expect(container.querySelector("form")).not.toBeNull()
    expect(container.querySelector("button[type='submit']")).not.toBeNull()
    // Three EditableField label spans (Name, Email, Message)
    expect(container.querySelectorAll("span.border-b-2").length).toBe(3)
  })
})
