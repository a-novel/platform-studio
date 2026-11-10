import type { TFunction } from "i18next";

/**
 * The genres the dialog offers and their names in the visitor's language, by the value a project stores. The
 * narrative engine takes any text, so a row shows a value this list does not know as it is.
 */
export function genreNames(t: TFunction<"common">): Record<string, string> {
  return {
    actionAdventure: t("projects.genres.actionAdventure"),
    alternateHistory: t("projects.genres.alternateHistory"),
    biographical: t("projects.genres.biographical"),
    childrens: t("projects.genres.childrens"),
    comedy: t("projects.genres.comedy"),
    comingOfAge: t("projects.genres.comingOfAge"),
    contemporary: t("projects.genres.contemporary"),
    crime: t("projects.genres.crime"),
    drama: t("projects.genres.drama"),
    dystopia: t("projects.genres.dystopia"),
    erotica: t("projects.genres.erotica"),
    espionage: t("projects.genres.espionage"),
    fairyTale: t("projects.genres.fairyTale"),
    fantasy: t("projects.genres.fantasy"),
    gothic: t("projects.genres.gothic"),
    historical: t("projects.genres.historical"),
    horror: t("projects.genres.horror"),
    literary: t("projects.genres.literary"),
    magicalRealism: t("projects.genres.magicalRealism"),
    mystery: t("projects.genres.mystery"),
    mythology: t("projects.genres.mythology"),
    noir: t("projects.genres.noir"),
    philosophical: t("projects.genres.philosophical"),
    political: t("projects.genres.political"),
    postApocalyptic: t("projects.genres.postApocalyptic"),
    psychological: t("projects.genres.psychological"),
    romance: t("projects.genres.romance"),
    satire: t("projects.genres.satire"),
    scienceFiction: t("projects.genres.scienceFiction"),
    sliceOfLife: t("projects.genres.sliceOfLife"),
    spiritual: t("projects.genres.spiritual"),
    superhero: t("projects.genres.superhero"),
    supernatural: t("projects.genres.supernatural"),
    thriller: t("projects.genres.thriller"),
    tragedy: t("projects.genres.tragedy"),
    war: t("projects.genres.war"),
    western: t("projects.genres.western"),
    youngAdult: t("projects.genres.youngAdult"),
  };
}
