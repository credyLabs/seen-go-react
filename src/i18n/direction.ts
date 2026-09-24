const RTL_LANGUAGES = ["ar", "he", "fa", "ur"]

export function getDirection(language: string): "ltr" | "rtl" {
  const languageCode = language.split("-")[0]

  return RTL_LANGUAGES.includes(languageCode) ? "rtl" : "ltr"
}
