import type { ChipOption } from "@a-novel-kit/uikit";

import type { TFunction } from "i18next";

/** A family of genres, as the dialog sets them apart: its name, and its genres' names by the value a project stores. */
export interface GenreFamily {
  name: string;
  genres: Record<string, string>;
}

/**
 * The genres the dialog offers, by family in the order it shows them, named in the visitor's language. A project
 * stores a genre's value, never its name, so each reader sees it in their own language. The narrative engine takes
 * any text, so a row shows a value this list does not know as it is.
 */
export function genreFamilies(t: TFunction<"common">): GenreFamily[] {
  return [
    {
      name: t("projects.genreFamilies.scienceFiction"),
      genres: {
        scienceFiction: t("projects.genres.scienceFiction"),
        nearFuture: t("projects.genres.nearFuture"),
        cyberpunk: t("projects.genres.cyberpunk"),
        steampunk: t("projects.genres.steampunk"),
        spaceOpera: t("projects.genres.spaceOpera"),
        hardScienceFiction: t("projects.genres.hardScienceFiction"),
        militaryScienceFiction: t("projects.genres.militaryScienceFiction"),
        comicScienceFiction: t("projects.genres.comicScienceFiction"),
        timeTravel: t("projects.genres.timeTravel"),
        parallelWorlds: t("projects.genres.parallelWorlds"),
        firstContact: t("projects.genres.firstContact"),
        alienInvasion: t("projects.genres.alienInvasion"),
        spaceExploration: t("projects.genres.spaceExploration"),
        alternateHistory: t("projects.genres.alternateHistory"),
        dystopia: t("projects.genres.dystopia"),
        utopia: t("projects.genres.utopia"),
        postApocalyptic: t("projects.genres.postApocalyptic"),
        apocalyptic: t("projects.genres.apocalyptic"),
        disasterFiction: t("projects.genres.disasterFiction"),
      },
    },
    {
      name: t("projects.genreFamilies.fantasy"),
      genres: {
        fantasy: t("projects.genres.fantasy"),
        highFantasy: t("projects.genres.highFantasy"),
        swordAndSorcery: t("projects.genres.swordAndSorcery"),
        urbanFantasy: t("projects.genres.urbanFantasy"),
        darkFantasy: t("projects.genres.darkFantasy"),
        historicalFantasy: t("projects.genres.historicalFantasy"),
        comicFantasy: t("projects.genres.comicFantasy"),
        arthurian: t("projects.genres.arthurian"),
        magicalRealism: t("projects.genres.magicalRealism"),
      },
    },
    {
      name: t("projects.genreFamilies.horror"),
      genres: {
        horror: t("projects.genres.horror"),
        supernatural: t("projects.genres.supernatural"),
        gothic: t("projects.genres.gothic"),
        cosmicHorror: t("projects.genres.cosmicHorror"),
        psychologicalHorror: t("projects.genres.psychologicalHorror"),
        ghostStory: t("projects.genres.ghostStory"),
        hauntedHouse: t("projects.genres.hauntedHouse"),
        vampires: t("projects.genres.vampires"),
        zombies: t("projects.genres.zombies"),
        slasher: t("projects.genres.slasher"),
      },
    },
    {
      name: t("projects.genreFamilies.crime"),
      genres: {
        crime: t("projects.genres.crime"),
        mystery: t("projects.genres.mystery"),
        noir: t("projects.genres.noir"),
        thriller: t("projects.genres.thriller"),
        psychologicalThriller: t("projects.genres.psychologicalThriller"),
        politicalThriller: t("projects.genres.politicalThriller"),
        medicalThriller: t("projects.genres.medicalThriller"),
        legalThriller: t("projects.genres.legalThriller"),
        technoThriller: t("projects.genres.technoThriller"),
        domesticThriller: t("projects.genres.domesticThriller"),
        espionage: t("projects.genres.espionage"),
        policeProcedural: t("projects.genres.policeProcedural"),
        privateEye: t("projects.genres.privateEye"),
        lockedRoomMystery: t("projects.genres.lockedRoomMystery"),
        historicalMystery: t("projects.genres.historicalMystery"),
        nordicNoir: t("projects.genres.nordicNoir"),
        serialKiller: t("projects.genres.serialKiller"),
        gangsterFiction: t("projects.genres.gangsterFiction"),
        heist: t("projects.genres.heist"),
        revenge: t("projects.genres.revenge"),
      },
    },
    {
      name: t("projects.genreFamilies.romance"),
      genres: {
        romance: t("projects.genres.romance"),
        romanticComedy: t("projects.genres.romanticComedy"),
        contemporaryRomance: t("projects.genres.contemporaryRomance"),
        historicalRomance: t("projects.genres.historicalRomance"),
        regencyRomance: t("projects.genres.regencyRomance"),
        paranormalRomance: t("projects.genres.paranormalRomance"),
        darkRomance: t("projects.genres.darkRomance"),
        romanticSuspense: t("projects.genres.romanticSuspense"),
        erotica: t("projects.genres.erotica"),
      },
    },
    {
      name: t("projects.genreFamilies.adventure"),
      genres: {
        actionAdventure: t("projects.genres.actionAdventure"),
        swashbuckler: t("projects.genres.swashbuckler"),
        pirates: t("projects.genres.pirates"),
        treasureHunt: t("projects.genres.treasureHunt"),
        nauticalFiction: t("projects.genres.nauticalFiction"),
        lostWorld: t("projects.genres.lostWorld"),
        survival: t("projects.genres.survival"),
        robinsonade: t("projects.genres.robinsonade"),
        martialArts: t("projects.genres.martialArts"),
        superhero: t("projects.genres.superhero"),
        western: t("projects.genres.western"),
        roadNovel: t("projects.genres.roadNovel"),
        animalFiction: t("projects.genres.animalFiction"),
      },
    },
    {
      name: t("projects.genreFamilies.history"),
      genres: {
        historical: t("projects.genres.historical"),
        prehistoric: t("projects.genres.prehistoric"),
        war: t("projects.genres.war"),
        familySaga: t("projects.genres.familySaga"),
      },
    },
    {
      name: t("projects.genreFamilies.drama"),
      genres: {
        drama: t("projects.genres.drama"),
        tragedy: t("projects.genres.tragedy"),
        melodrama: t("projects.genres.melodrama"),
        contemporary: t("projects.genres.contemporary"),
        comingOfAge: t("projects.genres.comingOfAge"),
        sliceOfLife: t("projects.genres.sliceOfLife"),
        socialNovel: t("projects.genres.socialNovel"),
        ruralFiction: t("projects.genres.ruralFiction"),
        political: t("projects.genres.political"),
        philosophical: t("projects.genres.philosophical"),
        psychological: t("projects.genres.psychological"),
        spiritual: t("projects.genres.spiritual"),
        feelGood: t("projects.genres.feelGood"),
        sports: t("projects.genres.sports"),
        lgbtq: t("projects.genres.lgbtq"),
      },
    },
    {
      name: t("projects.genreFamilies.comedy"),
      genres: {
        comedy: t("projects.genres.comedy"),
        comedyDrama: t("projects.genres.comedyDrama"),
        darkComedy: t("projects.genres.darkComedy"),
        satire: t("projects.genres.satire"),
        parody: t("projects.genres.parody"),
        pastiche: t("projects.genres.pastiche"),
        farce: t("projects.genres.farce"),
        comedyOfManners: t("projects.genres.comedyOfManners"),
        absurdist: t("projects.genres.absurdist"),
        tragicomedy: t("projects.genres.tragicomedy"),
        picaresque: t("projects.genres.picaresque"),
      },
    },
    {
      name: t("projects.genreFamilies.tales"),
      genres: {
        fairyTale: t("projects.genres.fairyTale"),
        fairyTaleRetelling: t("projects.genres.fairyTaleRetelling"),
        fable: t("projects.genres.fable"),
        legend: t("projects.genres.legend"),
        mythology: t("projects.genres.mythology"),
        epic: t("projects.genres.epic"),
        allegory: t("projects.genres.allegory"),
        christmasTale: t("projects.genres.christmasTale"),
      },
    },
    {
      name: t("projects.genreFamilies.trueStories"),
      genres: {
        memoir: t("projects.genres.memoir"),
        biographical: t("projects.genres.biographical"),
        autofiction: t("projects.genres.autofiction"),
        travel: t("projects.genres.travel"),
        trueCrime: t("projects.genres.trueCrime"),
        docufiction: t("projects.genres.docufiction"),
      },
    },
    {
      name: t("projects.genreFamilies.forms"),
      genres: {
        shortStory: t("projects.genres.shortStory"),
        novella: t("projects.genres.novella"),
        flashFiction: t("projects.genres.flashFiction"),
        epistolary: t("projects.genres.epistolary"),
        diaryNovel: t("projects.genres.diaryNovel"),
        ensembleNovel: t("projects.genres.ensembleNovel"),
        serial: t("projects.genres.serial"),
        romanFleuve: t("projects.genres.romanFleuve"),
        experimental: t("projects.genres.experimental"),
        fanFiction: t("projects.genres.fanFiction"),
      },
    },
    {
      name: t("projects.genreFamilies.stageScreenGames"),
      genres: {
        theatre: t("projects.genres.theatre"),
        screenplay: t("projects.genres.screenplay"),
        musical: t("projects.genres.musical"),
        rolePlayingGame: t("projects.genres.rolePlayingGame"),
        larp: t("projects.genres.larp"),
        murderParty: t("projects.genres.murderParty"),
      },
    },
    {
      name: t("projects.genreFamilies.audience"),
      genres: {
        childrens: t("projects.genres.childrens"),
        youngAdult: t("projects.genres.youngAdult"),
      },
    },
  ];
}

/** Every genre's name, by the value a project stores. */
export function genreNames(families: readonly GenreFamily[]): Record<string, string> {
  return Object.assign({}, ...families.map(({ genres }) => genres));
}

/** The dialog's chips: each family's genres in the visitor's alphabetical order, under the family's name. */
export function genreChoices(families: readonly GenreFamily[], language: string): ChipOption[] {
  return families.flatMap(({ name, genres }) =>
    Object.entries(genres)
      .map(([value, label]) => ({ value, label, section: name }))
      .toSorted((a, b) => a.label.localeCompare(b.label, language))
  );
}
