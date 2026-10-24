import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Text, View, type ScrollView } from "react-native";
import { Link, useLocalSearchParams } from "expo-router";
import { SeoHead } from "@/components/SeoHead";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { LoadingState } from "@/components/StateViews";
import { YouTubeEmbed } from "@/components/YouTube";
import { Field, FieldError, FieldLabel } from "@/components/form/Field";
import { Select } from "@/components/form/Select";
import { MultiSelect } from "@/components/form/MultiSelect";
import { MonthPicker } from "@/components/form/MonthPicker";
import { Collapsible } from "@/components/form/Collapsible";
import { LangSwitch, useFormLang, useLangFonts } from "@/components/form/LangSwitch";
import { PhotoThumb, pickCompressedPhotos } from "@/components/form/PhotoThumb";
import { useTheme } from "@/constants/theme-context";
import { ApiError, errorMessage, fcApi } from "@/lib/api";
import { canPickImages, revokePreview, type UploadablePhoto } from "@/lib/images";
import { normalizeIndianMobile } from "@/lib/format";
import { FORM_TEXT, itemLabel, type FormLang, type FormText } from "@/lib/farmFormText";
import type { FarmEditView, FcLists, OwnerFarm } from "@/lib/types";

// ── Local form model (strings for inputs; converted to the owner payload on submit) ──────────

const FACT_KEYS = [
  "total_land",
  "established_year",
  "soil_type",
  "irrigation",
  "farming_method",
  "annual_production",
  "mother_plant_stock",
  "workforce_size",
  "main_markets",
  "certifications",
] as const;
type FactKey = (typeof FACT_KEYS)[number];

type GrownRow = { key: number; crop_id: number | null; variety: string; area_or_count: string; harvest_months: number[]; photo_url: string | null; note: string };
type ServiceRow = { key: number; preset_id: number | null; name: string; description: string };
type GalleryItem = { url: string; caption: string; photo_category_id: number | null };
type VideoRow = { key: number; url: string; title: string };
type LinkRow = { key: number; url: string };

type EditForm = {
  name: string;
  farm_type_ids: number[];
  crop_ids: number[];
  other_crops: string;
  state_id: number | null;
  district_id: number | null;
  area_name: string;
  address: string;
  map_url: string;
  owner_name: string;
  owner_role: string;
  owner_photo_url: string | null;
  language_ids: number[];
  mobile: string;
  mobile_is_whatsapp: boolean;
  whatsapp_number: string;
  email: string;
  links: LinkRow[];
  facts: Record<FactKey, string>;
  short_intro: string;
  story: string;
  owner_quote: string;
  advice: string;
  cover_url: string | null;
  gallery: GalleryItem[];
  videos: VideoRow[];
  grown: GrownRow[];
  services: ServiceRow[];
  training: {
    onsite_available: boolean;
    duration: string;
    topics: string;
    language: string;
    batch_size: string;
    fee_text: string;
    months: number[];
    course_available: boolean;
    course_title: string;
    course_language: string;
  };
};

let rowKey = 1;
const nextKey = () => rowKey++;
const str = (v: unknown) => (v == null ? "" : String(v));
const orNull = (v: string) => (v.trim() ? v.trim() : null);

function toForm(o: OwnerFarm): EditForm {
  const facts = {} as Record<FactKey, string>;
  for (const k of FACT_KEYS) facts[k] = str(o.facts?.[k]);
  const tr = o.training;
  return {
    name: str(o.name),
    farm_type_ids: o.farm_type_ids ?? [],
    crop_ids: o.crop_ids ?? [],
    other_crops: str(o.other_crops),
    state_id: o.state_id ?? null,
    district_id: o.district_id ?? null,
    area_name: str(o.area_name),
    address: str(o.address),
    map_url: str(o.map_url),
    owner_name: str(o.owner_name),
    owner_role: str(o.owner_role),
    owner_photo_url: o.owner_photo_url ?? null,
    language_ids: o.language_ids ?? [],
    mobile: str(o.mobile),
    mobile_is_whatsapp: o.mobile_is_whatsapp ?? true,
    whatsapp_number: str(o.whatsapp_number),
    email: str(o.email),
    links: (o.links ?? []).map((url) => ({ key: nextKey(), url: str(url) })),
    facts,
    short_intro: str(o.short_intro),
    story: str(o.story),
    owner_quote: str(o.owner_quote),
    advice: str(o.advice),
    cover_url: o.cover_url ?? null,
    gallery: (o.gallery ?? []).map((g) => ({ url: g.url, caption: str(g.caption), photo_category_id: g.photo_category_id ?? null })),
    videos: (o.videos ?? []).map((v) => ({
      key: nextKey(),
      url: v.url ? v.url : v.video_id ? `https://www.youtube.com/watch?v=${v.video_id}` : "",
      title: str(v.title),
    })),
    grown: (o.grown ?? []).map((g) => ({
      key: nextKey(),
      crop_id: g.crop_id ?? null,
      variety: str(g.variety),
      area_or_count: str(g.area_or_count),
      harvest_months: (g.harvest_months ?? []).map(Number).filter((m) => m >= 1 && m <= 12),
      photo_url: g.photo_url ?? null,
      note: str(g.note),
    })),
    services: (o.services ?? []).map((s) => ({ key: nextKey(), preset_id: s.preset_id ?? null, name: str(s.name), description: str(s.description) })),
    training: {
      onsite_available: !!tr?.onsite_available,
      duration: str(tr?.duration),
      topics: str(tr?.topics),
      language: str(tr?.language),
      batch_size: str(tr?.batch_size),
      fee_text: str(tr?.fee_text),
      months: (tr?.months ?? []).map(Number).filter((m) => m >= 1 && m <= 12),
      course_available: !!tr?.course_available,
      course_title: str(tr?.course_title),
      course_language: str(tr?.course_language),
    },
  };
}

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const YT_URL = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?(.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)[A-Za-z0-9_-]{11}/i;
const MOBILE_RE = /^[6-9]\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LAND_RE = /^\d{1,7}(\.\d{1,2})?$/;
const URL_RE = /^https?:\/\/\S+$/i;
/** A phone number or email typed into the public story text (Storefront §8 inline warning). */
const CONTACT_RE = /(\+?91[\s-]?)?[6-9]\d{2}[\s-]?\d{3}[\s-]?\d{4}|\b\d{10}\b|[^\s@]+@[^\s@]+\.[a-z]{2,}/i;

function toPayload(f: EditForm): OwnerFarm {
  const mobile = f.mobile.trim() ? normalizeIndianMobile(f.mobile) : "";
  const facts: Record<string, string> = {};
  for (const k of FACT_KEYS) if (f.facts[k].trim()) facts[k] = f.facts[k].trim();
  return {
    name: orNull(f.name),
    farm_type_ids: f.farm_type_ids,
    crop_ids: f.crop_ids,
    other_crops: orNull(f.other_crops),
    state_id: f.state_id,
    district_id: f.district_id,
    area_name: orNull(f.area_name),
    address: orNull(f.address),
    map_url: orNull(f.map_url),
    owner_name: orNull(f.owner_name),
    owner_role: orNull(f.owner_role),
    owner_photo_url: f.owner_photo_url,
    language_ids: f.language_ids,
    // The backend refuses an empty mobile, so a blank box simply isn't proposed.
    ...(mobile ? { mobile } : {}),
    mobile_is_whatsapp: f.mobile_is_whatsapp,
    whatsapp_number: f.whatsapp_number.trim() ? normalizeIndianMobile(f.whatsapp_number) : null,
    email: orNull(f.email),
    links: f.links.map((l) => l.url.trim()).filter(Boolean),
    facts,
    short_intro: orNull(f.short_intro),
    story: orNull(f.story),
    owner_quote: orNull(f.owner_quote),
    advice: orNull(f.advice),
    cover_url: f.cover_url,
    gallery: f.gallery.map((g) => ({ url: g.url, caption: orNull(g.caption), photo_category_id: g.photo_category_id })),
    videos: f.videos
      .filter((v) => v.url.trim())
      .map((v) => {
        const u = v.url.trim();
        return YT_ID.test(u) ? { video_id: u, title: orNull(v.title) } : { url: u, title: orNull(v.title) };
      }),
    grown: f.grown
      .filter((r) => r.crop_id != null || r.variety.trim() || r.note.trim())
      .map((r) => ({
        crop_id: r.crop_id,
        variety: orNull(r.variety),
        area_or_count: orNull(r.area_or_count),
        harvest_months: r.harvest_months,
        photo_url: r.photo_url,
        note: orNull(r.note),
      })),
    services: f.services
      .filter((r) => r.preset_id != null || r.name.trim())
      .map((r) => ({ preset_id: r.preset_id, name: orNull(r.name), description: orNull(r.description) })),
    training: {
      onsite_available: f.training.onsite_available,
      duration: orNull(f.training.duration),
      topics: orNull(f.training.topics),
      language: orNull(f.training.language),
      batch_size: orNull(f.training.batch_size),
      fee_text: orNull(f.training.fee_text),
      months: f.training.months,
      course_available: f.training.course_available,
      course_title: orNull(f.training.course_title),
      course_language: orNull(f.training.course_language),
    },
  };
}

type Errors = Record<string, string>;

function validate(f: EditForm, t: FormText, maxIntro = 200): Errors {
  const e: Errors = {};
  if (!f.name.trim()) e.name = t.errName;
  if (f.mobile.trim() && !MOBILE_RE.test(normalizeIndianMobile(f.mobile))) e.mobile = t.errMobile;
  if (f.whatsapp_number.trim() && !MOBILE_RE.test(normalizeIndianMobile(f.whatsapp_number))) e.whatsapp_number = t.errWhatsapp;
  if (f.email.trim() && !EMAIL_RE.test(f.email.trim())) e.email = t.errEmail;
  if (f.map_url.trim() && !URL_RE.test(f.map_url.trim())) e.map_url = t.errUrl;
  if (f.short_intro.trim().length > maxIntro) e.short_intro = t.errIntro;
  if (f.facts.total_land.trim() && !LAND_RE.test(f.facts.total_land.trim())) e.total_land = t.errLand;
  if (f.facts.established_year.trim()) {
    const y = Number(f.facts.established_year.trim());
    if (!/^\d{4}$/.test(f.facts.established_year.trim()) || y < 1800 || y > new Date().getFullYear()) e.established_year = t.errYear;
  }
  f.videos.forEach((v) => {
    const u = v.url.trim();
    if (u && !YT_ID.test(u) && !YT_URL.test(u)) e[`video-${v.key}`] = t.errVideo;
  });
  return e;
}

/** Section a field error belongs to, so its section can be flagged. */
const SECTION_OF: Record<string, string> = {
  name: "details",
  map_url: "location",
  mobile: "owner",
  whatsapp_number: "owner",
  email: "owner",
  total_land: "facts",
  established_year: "facts",
  short_intro: "story",
};

// ── Page ──────────────────────────────────────────────────────────────────────────────────────

/** Storefront §8 — the private farm edit page opened from the team's WhatsApp link. No login. */
export default function FarmEditPage() {
  const { colors, spacing } = useTheme();
  const params = useLocalSearchParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [lang, setLang] = useFormLang();
  const t = FORM_TEXT[lang];
  const lf = useLangFonts(lang);
  const scrollRef = useRef<ScrollView>(null);

  const [view, setView] = useState<FarmEditView | null>(null);
  const [lists, setLists] = useState<FcLists | null>(null);
  const [inactive, setInactive] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const pendingToken = token === undefined || token === "" || token === "[token]";

  useEffect(() => {
    if (pendingToken || !token) return;
    let alive = true;
    setLoadFailed(false);
    setInactive(false);
    fcApi
      .getFarmEdit(token)
      .then(async (v) => {
        const l = await fcApi.getLists();
        if (!alive) return;
        setView(v);
        setLists(l);
      })
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError && (e.code === "LINK_INACTIVE" || e.kind === "rejected")) setInactive(true);
        else setLoadFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [token, pendingToken, attempt]);

  const shell = (children: React.ReactNode) => (
    <AppShell
      keyboardAware
      hideBottomNav
      scrollRef={scrollRef}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 720, width: "100%", alignSelf: "center" }}
    >
      <SeoHead title="Edit your farm · FarmsClub" noindex />
      {children}
    </AppShell>
  );

  if (pendingToken) return shell(<LoadingState label="" />);

  const top = (
    <View style={{ gap: spacing.md, marginBottom: spacing.lg }}>
      {/* Admin Settings "Hindi on registration & edit pages": hide the switch when it is off. */}
      {view?.hindi_enabled !== false && <LangSwitch lang={lang} onChange={setLang} />}
      <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: lf.display, fontSize: 27, lineHeight: lang === "hi" ? 40 : 33, color: colors.ink }}>
        {t.editTitle}
      </Text>
    </View>
  );

  if (inactive) {
    return shell(
      <>
        {top}
        <View style={{ alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md }} accessibilityLiveRegion="polite">
          <Text style={{ fontFamily: lf.semibold, fontSize: 16, color: colors.ink, textAlign: "center", maxWidth: 420, lineHeight: lang === "hi" ? 28 : 23 }}>
            {t.linkInactive}
          </Text>
          <Link href="/contact" asChild>
            <Button label={t.contactFarmsClub} />
          </Link>
        </View>
      </>,
    );
  }
  if (loadFailed) {
    return shell(
      <>
        {top}
        <View style={{ alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md }}>
          <Text style={{ fontFamily: lf.body, fontSize: 15, color: colors.inkSoft, textAlign: "center" }}>{t.loadError}</Text>
          <Button label={t.retry} variant="outline" onPress={() => setAttempt((n) => n + 1)} />
        </View>
      </>,
    );
  }
  if (!view || !lists) return shell(<>{top}<LoadingState label={t.loading} /></>);

  return shell(
    <>
      {top}
      <Editor key={attempt} token={token as string} view={view} lists={lists} lang={lang} scrollRef={scrollRef} onSubmitted={() => setView({ ...view, status_banner: "UNDER_REVIEW", has_pending: true })} />
    </>,
  );
}

// ── Editor ────────────────────────────────────────────────────────────────────────────────────

function Editor({
  token,
  view,
  lists,
  lang,
  scrollRef,
  onSubmitted,
}: {
  token: string;
  view: FarmEditView;
  lists: FcLists;
  lang: FormLang;
  scrollRef: React.RefObject<ScrollView | null>;
  onSubmitted: () => void;
}) {
  const { colors, fonts, spacing, radius } = useTheme();
  const t = FORM_TEXT[lang];
  const lf = useLangFonts(lang);
  const hiFont = lang === "hi" ? lf.semibold : undefined;
  const labelProps = { labelFont: lf.semibold, helpFont: lf.body };

  const [f, setF] = useState<EditForm>(() => toForm(view.pending ?? view.farm));
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null); // which control is uploading
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const maxGallery = Math.max(1, view.max_gallery_photos || 40);

  const upd = useCallback((patch: Partial<EditForm>) => setF((p) => ({ ...p, ...patch })), []);
  const setFact = (k: FactKey, v: string) => setF((p) => ({ ...p, facts: { ...p.facts, [k]: v } }));
  const setTraining = (patch: Partial<EditForm["training"]>) => setF((p) => ({ ...p, training: { ...p.training, ...patch } }));

  const state = useMemo(() => lists.states.find((s) => s.id === f.state_id) ?? null, [lists, f.state_id]);
  const cropOptions = useMemo(() => lists.crops.map((x) => ({ value: x.id, label: itemLabel(x, lang) })), [lists, lang]);
  const storyHasContact = [f.short_intro, f.story, f.owner_quote, f.advice].some((s) => CONTACT_RE.test(s));

  /** Uploads compressed images in batches of ≤10; returns the stored URLs and per-file errors. */
  async function upload(blobs: UploadablePhoto[]): Promise<{ urls: string[]; failed: string[] }> {
    const urls: string[] = [];
    const failed: string[] = [];
    for (let i = 0; i < blobs.length; i += 10) {
      const batch = blobs.slice(i, i + 10);
      try {
        const res = await fcApi.uploadFarmEditPhotos(token, batch);
        res.forEach((r, j) => {
          if (r.url) urls.push(r.url);
          else failed.push(`${t.uploadFailed(`#${i + j + 1}`)}${r.error ? ` ${r.error}` : ""}`);
        });
      } catch (e) {
        failed.push(errorMessage(e));
      }
    }
    return { urls, failed };
  }

  async function pickAndUpload(max: number, which: string): Promise<string[]> {
    setUploadErrors([]);
    const { photos, tooBig, unreadable } = await pickCompressedPhotos(max);
    const notes: string[] = [...(tooBig ? [t.photoTooBig] : []), ...(unreadable ? [t.photoUnreadable] : [])];
    if (!photos.length) {
      setUploadErrors(notes);
      return [];
    }
    setUploading(which);
    const { urls, failed } = await upload(photos.map((p) => p.photo));
    photos.forEach((p) => revokePreview(p.preview));
    setUploading(null);
    setUploadErrors([...notes, ...failed]);
    return urls;
  }

  async function addGallery() {
    const room = maxGallery - f.gallery.length;
    if (room <= 0) {
      setUploadErrors([t.galleryFull(maxGallery)]);
      return;
    }
    const urls = await pickAndUpload(Math.min(room, 20), "gallery");
    if (!urls.length) return;
    setF((p) => {
      const gallery = [...p.gallery, ...urls.map((url) => ({ url, caption: "", photo_category_id: null }))].slice(0, maxGallery);
      return { ...p, gallery, cover_url: p.cover_url ?? gallery[0]?.url ?? null };
    });
  }

  async function submit() {
    if (submitting) return;
    setSubmitError(null);
    setSubmittedMsg(null);
    const found = validate(f, t);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSubmitting(true);
    try {
      const res = await fcApi.submitFarmEdit(token, toPayload(f));
      setSubmittedMsg(lang === "hi" ? t.submitted : res.message ?? t.submitted);
      onSubmitted();
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (e) {
      setSubmitError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  const sectionHasError = (sec: string) => Object.keys(errors).some((k) => SECTION_OF[k] === sec || (sec === "media" && k.startsWith("video-")));

  const banner = view.status_banner;
  const bannerText = banner === "UNDER_REVIEW" ? t.bannerUnderReview : banner === "LIVE" ? t.bannerLive : t.bannerPreparing;
  const bannerColors =
    banner === "UNDER_REVIEW" ? { bg: colors.warningSoft, fg: colors.warning } : banner === "LIVE" ? { bg: colors.successSoft, fg: colors.success } : { bg: colors.infoSoft, fg: colors.info };
  const textLH = lang === "hi" ? 25 : 21;

  const removeBtn = (onPress: () => void, label: string) => (
    <Button label={t.remove} variant="outline" onPress={onPress} accessibilityLabel={label} />
  );

  return (
    <View style={{ gap: spacing.lg }}>
      {/* Status banner */}
      <View accessibilityRole="summary" style={{ backgroundColor: bannerColors.bg, borderRadius: radius.md, padding: spacing.md, gap: 6 }}>
        <Text style={{ fontFamily: lf.semibold, fontSize: 15.5, color: bannerColors.fg }}>{bannerText}</Text>
        {view.profile_url ? (
          <Link
            href={view.profile_url as never}
            {...(Platform.OS === "web" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            style={{ fontFamily: hiFont ?? fonts.bodySemiBold, fontSize: 14, color: colors.brand, textDecorationLine: "underline", paddingVertical: 6 }}
          >
            {t.viewLive} →
          </Link>
        ) : null}
      </View>

      {submittedMsg ? (
        <View accessibilityRole="alert" aria-live="polite" style={{ backgroundColor: colors.successSoft, borderRadius: radius.md, padding: spacing.md }}>
          <Text style={{ fontFamily: lf.semibold, fontSize: 15, color: colors.success, lineHeight: textLH }}>{submittedMsg}</Text>
        </View>
      ) : null}

      <Text style={{ fontFamily: lf.body, fontSize: 15, color: colors.inkSoft, lineHeight: textLH }}>{t.editIntro}</Text>
      {view.has_pending && !submittedMsg ? (
        <Text style={{ fontFamily: lf.body, fontSize: 14, color: colors.warning, lineHeight: textLH }}>{t.pendingNote}</Text>
      ) : null}

      {!view.verified ? (
        <View style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.brandSoft, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md }}>
          <Text style={{ fontFamily: lf.heading, fontSize: 16, color: colors.ink, lineHeight: lang === "hi" ? 27 : 22 }}>{t.verifyTitle}</Text>
          <Link href={{ pathname: "/contact", params: { topic: "Farm verification", ...(view.farm_name ? { farm: view.farm_name } : {}) } }} asChild>
            <Button label={t.verifyButton} />
          </Link>
          {view.verification_contact_text ? (
            <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft }}>{view.verification_contact_text}</Text>
          ) : null}
        </View>
      ) : null}

      {view.hero_video ? (
        <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.surface }}>
          <Text style={{ fontFamily: lf.heading, fontSize: 16, color: colors.ink }}>{t.heroVideoTitle}</Text>
          {view.hero_video.title ? <Text style={{ fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft }}>{view.hero_video.title}</Text> : null}
          <View style={{ maxWidth: 360, width: "100%" }}>
            <YouTubeEmbed videoId={view.hero_video.video_id} title={view.hero_video.title} />
          </View>
          <Text style={{ fontFamily: lf.body, fontSize: 13, color: colors.inkFaint }}>{t.heroVideoNote}</Text>
        </View>
      ) : null}

      {/* 1. Farm details */}
      <Collapsible title={t.secDetails} defaultOpen font={lf.heading} flag={sectionHasError("details")}>
        <Field id="fe-name" label={t.farmName} value={f.name} onChangeText={(v) => upd({ name: v })} required maxLength={200} error={errors.name} {...labelProps} />
        <MultiSelect
          id="fe-types"
          label={t.farmType}
          help={t.farmTypeHelp}
          options={lists.farmTypes.map((x) => ({ value: x.id, label: itemLabel(x, lang) }))}
          selected={f.farm_type_ids}
          onChange={(v) => upd({ farm_type_ids: v })}
          chipFont={hiFont}
          {...labelProps}
        />
        <MultiSelect
          id="fe-crops"
          label={t.crops}
          help={t.cropsHelp}
          options={cropOptions}
          selected={f.crop_ids}
          onChange={(v) => upd({ crop_ids: v })}
          searchable
          searchPlaceholder={t.searchCrops}
          noMatches={t.noMatches}
          showAllLabel={t.showAll}
          showLessLabel={t.showLess}
          chipFont={hiFont}
          {...labelProps}
        />
        <Field id="fe-other-crops" label={t.otherCrops} help={t.otherCropsHelp} value={f.other_crops} onChangeText={(v) => upd({ other_crops: v })} maxLength={300} {...labelProps} />
      </Collapsible>

      {/* 2. Location */}
      <Collapsible title={t.secLocation} font={lf.heading} flag={sectionHasError("location")}>
        <Select
          id="fe-state"
          label={t.state}
          value={f.state_id}
          onChange={(v) => upd({ state_id: v, district_id: null })}
          options={lists.states.map((s) => ({ value: s.id, label: s.name }))}
          placeholder={t.chooseState}
          {...labelProps}
        />
        {!state || state.districts.length > 0 ? (
          <Select
            id="fe-district"
            label={t.district}
            value={f.district_id}
            onChange={(v) => upd({ district_id: v })}
            options={(state?.districts ?? []).map((d) => ({ value: d.id, label: d.name }))}
            placeholder={state ? t.chooseDistrict : t.chooseStateFirst}
            disabled={!state}
            {...labelProps}
          />
        ) : null}
        <Field id="fe-area" label={t.areaName} value={f.area_name} onChangeText={(v) => upd({ area_name: v })} maxLength={200} {...labelProps} />
        <Text style={{ fontFamily: lf.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: textLH }}>{t.teamOnlyNote}</Text>
        <Field id="fe-address" label={t.address} value={f.address} onChangeText={(v) => upd({ address: v })} multiline minHeight={80} maxLength={1000} {...labelProps} />
        <Field id="fe-map" label={t.mapUrl} value={f.map_url} onChangeText={(v) => upd({ map_url: v })} maxLength={500} autoCapitalize="none" inputMode="url" placeholder="https://maps.google.com/…" error={errors.map_url} {...labelProps} />
      </Collapsible>

      {/* 3. Owner & contact */}
      <Collapsible title={t.secOwner} font={lf.heading} flag={sectionHasError("owner")}>
        <Field id="fe-owner" label={t.ownerName} value={f.owner_name} onChangeText={(v) => upd({ owner_name: v })} maxLength={160} {...labelProps} />
        <Field id="fe-role" label={t.ownerRole} value={f.owner_role} onChangeText={(v) => upd({ owner_role: v })} maxLength={100} {...labelProps} />
        <View style={{ gap: spacing.sm }}>
          <FieldLabel label={t.ownerPhoto} {...labelProps} />
          <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flexWrap: "wrap" }}>
            {f.owner_photo_url ? <PhotoThumb uri={f.owner_photo_url} alt={t.ownerPhoto} onRemove={() => upd({ owner_photo_url: null })} removeLabel={`${t.remove}: ${t.ownerPhoto}`} /> : null}
            {canPickImages ? (
              <Button
                label={uploading === "owner" ? t.uploading : f.owner_photo_url ? t.changePhoto : t.uploadPhoto}
                variant="outline"
                loading={uploading === "owner"}
                disabled={!!uploading}
                onPress={async () => {
                  const [url] = await pickAndUpload(1, "owner");
                  if (url) upd({ owner_photo_url: url });
                }}
              />
            ) : null}
          </View>
        </View>
        {lists.languages.length > 0 ? (
          <MultiSelect
            id="fe-langs"
            label={t.languages}
            options={lists.languages.map((x) => ({ value: x.id, label: itemLabel(x, lang) }))}
            selected={f.language_ids}
            onChange={(v) => upd({ language_ids: v })}
            chipFont={hiFont}
            {...labelProps}
          />
        ) : null}
        <Text style={{ fontFamily: lf.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: textLH }}>{t.contactNote}</Text>
        <Field id="fe-mobile" label={t.mobile} value={f.mobile} onChangeText={(v) => upd({ mobile: v.replace(/[^\d+\s-]/g, "") })} keyboardType="phone-pad" inputMode="tel" maxLength={16} error={errors.mobile} {...labelProps} />
        <Checkbox checked={f.mobile_is_whatsapp} onChange={(v) => upd({ mobile_is_whatsapp: v })} label={t.onWhatsapp} fontFamily={hiFont} />
        <Field id="fe-wa" label={t.whatsappNumber} value={f.whatsapp_number} onChangeText={(v) => upd({ whatsapp_number: v.replace(/[^\d+\s-]/g, "") })} keyboardType="phone-pad" inputMode="tel" maxLength={16} error={errors.whatsapp_number} {...labelProps} />
        <Field id="fe-email" label={t.email} value={f.email} onChangeText={(v) => upd({ email: v })} keyboardType="email-address" inputMode="email" autoCapitalize="none" maxLength={200} error={errors.email} {...labelProps} />
        <View style={{ gap: spacing.sm }}>
          <FieldLabel label={t.links} {...labelProps} />
          {f.links.map((l, i) => (
            <View key={l.key} style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" }}>
              <View style={{ flex: 1 }}>
                <Field
                  id={`fe-link-${l.key}`}
                  label={`${t.links} ${i + 1}`}
                  value={l.url}
                  onChangeText={(v) => upd({ links: f.links.map((x) => (x.key === l.key ? { ...x, url: v } : x)) })}
                  autoCapitalize="none"
                  inputMode="url"
                  maxLength={300}
                  {...labelProps}
                />
              </View>
              {removeBtn(() => upd({ links: f.links.filter((x) => x.key !== l.key) }), `${t.remove} ${t.links} ${i + 1}`)}
            </View>
          ))}
          {f.links.length < 10 ? <Button label={`+ ${t.addLink}`} variant="secondary" onPress={() => upd({ links: [...f.links, { key: nextKey(), url: "" }] })} /> : null}
        </View>
      </Collapsible>

      {/* 4. Farm facts */}
      <Collapsible title={t.secFacts} font={lf.heading} flag={sectionHasError("facts")}>
        {FACT_KEYS.map((k) => (
          <Field
            key={k}
            id={`fe-fact-${k}`}
            label={t.facts[k]}
            value={f.facts[k]}
            onChangeText={(v) => setFact(k, k === "total_land" ? v.replace(/[^\d.]/g, "") : k === "established_year" ? v.replace(/\D/g, "") : v)}
            keyboardType={k === "total_land" ? "decimal-pad" : k === "established_year" ? "number-pad" : undefined}
            inputMode={k === "total_land" ? "decimal" : k === "established_year" ? "numeric" : undefined}
            maxLength={k === "established_year" ? 4 : k === "total_land" ? 10 : 300}
            error={errors[k]}
            {...labelProps}
          />
        ))}
      </Collapsible>

      {/* 5. Story */}
      <Collapsible title={t.secStory} font={lf.heading} flag={sectionHasError("story") || storyHasContact}>
        <View
          accessibilityRole={storyHasContact ? "alert" : undefined}
          style={{ backgroundColor: storyHasContact ? colors.dangerSoft : colors.warningSoft, borderRadius: radius.md, padding: spacing.md }}
        >
          <Text style={{ fontFamily: lf.semibold, fontSize: 14, color: storyHasContact ? colors.danger : colors.ink, lineHeight: textLH }}>
            {storyHasContact ? t.storyWarningFound : t.storyWarning}
          </Text>
        </View>
        <Field id="fe-intro" label={t.shortIntro} help={t.shortIntroHelp} value={f.short_intro} onChangeText={(v) => upd({ short_intro: v })} multiline minHeight={70} maxLength={200} counter error={errors.short_intro} {...labelProps} />
        <Field id="fe-story" label={t.story} value={f.story} onChangeText={(v) => upd({ story: v })} multiline minHeight={180} maxLength={20000} {...labelProps} />
        <Field id="fe-quote" label={t.ownerQuote} value={f.owner_quote} onChangeText={(v) => upd({ owner_quote: v })} multiline minHeight={70} maxLength={1000} {...labelProps} />
        <Field id="fe-advice" label={t.advice} value={f.advice} onChangeText={(v) => upd({ advice: v })} multiline minHeight={110} maxLength={5000} {...labelProps} />
      </Collapsible>

      {/* 6. What we grow */}
      <Collapsible title={t.secGrow} font={lf.heading}>
        {f.grown.length === 0 ? <Text style={{ fontFamily: lf.body, fontSize: 14, color: colors.inkSoft }}>{t.noCropRows}</Text> : null}
        {f.grown.map((r, i) => {
          const setRow = (patch: Partial<GrownRow>) => setF((p) => ({ ...p, grown: p.grown.map((x) => (x.key === r.key ? { ...x, ...patch } : x)) }));
          return (
            <View key={r.key} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.md, backgroundColor: colors.paper }}>
              <Select id={`fe-grow-crop-${r.key}`} label={`${t.crop} ${i + 1}`} value={r.crop_id} onChange={(v) => setRow({ crop_id: v })} options={cropOptions} placeholder={t.chooseCrop} {...labelProps} />
              <Field id={`fe-grow-variety-${r.key}`} label={t.variety} value={r.variety} onChangeText={(v) => setRow({ variety: v })} maxLength={200} {...labelProps} />
              <Field id={`fe-grow-area-${r.key}`} label={t.areaOrCount} value={r.area_or_count} onChangeText={(v) => setRow({ area_or_count: v })} maxLength={100} {...labelProps} />
              <MonthPicker label={t.harvestMonths} value={r.harvest_months} onChange={(v) => setRow({ harvest_months: v })} lang={lang} labelFont={lf.semibold} />
              <View style={{ gap: spacing.sm }}>
                <FieldLabel label={t.cropPhoto} {...labelProps} />
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md, flexWrap: "wrap" }}>
                  {r.photo_url ? <PhotoThumb uri={r.photo_url} alt={t.cropPhoto} size={88} onRemove={() => setRow({ photo_url: null })} removeLabel={`${t.remove}: ${t.cropPhoto}`} /> : null}
                  {canPickImages ? (
                    <Button
                      label={uploading === `grow-${r.key}` ? t.uploading : r.photo_url ? t.changePhoto : t.uploadPhoto}
                      variant="outline"
                      loading={uploading === `grow-${r.key}`}
                      disabled={!!uploading}
                      onPress={async () => {
                        const [url] = await pickAndUpload(1, `grow-${r.key}`);
                        if (url) setRow({ photo_url: url });
                      }}
                    />
                  ) : null}
                </View>
              </View>
              <Field id={`fe-grow-note-${r.key}`} label={t.note} value={r.note} onChangeText={(v) => setRow({ note: v })} maxLength={500} {...labelProps} />
              {removeBtn(() => setF((p) => ({ ...p, grown: p.grown.filter((x) => x.key !== r.key) })), `${t.remove} ${t.crop} ${i + 1}`)}
            </View>
          );
        })}
        {f.grown.length < 50 ? (
          <Button
            label={`+ ${t.addCropRow}`}
            variant="secondary"
            onPress={() => upd({ grown: [...f.grown, { key: nextKey(), crop_id: null, variety: "", area_or_count: "", harvest_months: [], photo_url: null, note: "" }] })}
          />
        ) : null}
      </Collapsible>

      {/* 7. Services */}
      <Collapsible title={t.secServices} font={lf.heading}>
        {lists.services.map((preset) => {
          const row = f.services.find((s) => s.preset_id === preset.id);
          const label = itemLabel(preset, lang);
          return (
            <View key={preset.id} style={{ gap: spacing.sm }}>
              <Checkbox
                checked={!!row}
                label={label}
                fontFamily={hiFont}
                onChange={(on) =>
                  setF((p) => ({
                    ...p,
                    services: on
                      ? [...p.services, { key: nextKey(), preset_id: preset.id, name: preset.nameEn, description: "" }]
                      : p.services.filter((s) => s.preset_id !== preset.id),
                  }))
                }
              />
              {row ? (
                <View style={{ marginLeft: 34 }}>
                  <Field
                    id={`fe-svc-${preset.id}`}
                    label={`${label}: ${t.serviceDescription}`}
                    value={row.description}
                    onChangeText={(v) => setF((p) => ({ ...p, services: p.services.map((s) => (s.key === row.key ? { ...s, description: v } : s)) }))}
                    maxLength={300}
                    {...labelProps}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
        <FieldLabel label={t.customServices} {...labelProps} />
        {f.services
          .filter((s) => s.preset_id == null)
          .map((s, i) => {
            const setRow = (patch: Partial<ServiceRow>) => setF((p) => ({ ...p, services: p.services.map((x) => (x.key === s.key ? { ...x, ...patch } : x)) }));
            return (
              <View key={s.key} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.md, backgroundColor: colors.paper }}>
                <Field id={`fe-csvc-name-${s.key}`} label={`${t.serviceName} ${i + 1}`} value={s.name} onChangeText={(v) => setRow({ name: v })} maxLength={200} {...labelProps} />
                <Field id={`fe-csvc-desc-${s.key}`} label={t.serviceDescription} value={s.description} onChangeText={(v) => setRow({ description: v })} maxLength={300} {...labelProps} />
                {removeBtn(() => setF((p) => ({ ...p, services: p.services.filter((x) => x.key !== s.key) })), `${t.remove} ${t.serviceName} ${i + 1}`)}
              </View>
            );
          })}
        {f.services.length < 30 ? (
          <Button label={`+ ${t.addService}`} variant="secondary" onPress={() => upd({ services: [...f.services, { key: nextKey(), preset_id: null, name: "", description: "" }] })} />
        ) : null}
      </Collapsible>

      {/* 8. Training & courses */}
      <Collapsible title={t.secTraining} font={lf.heading}>
        <Checkbox checked={f.training.onsite_available} onChange={(v) => setTraining({ onsite_available: v })} label={t.onsiteTraining} fontFamily={hiFont} />
        {f.training.onsite_available ? (
          <View style={{ gap: spacing.md }}>
            <Field id="fe-tr-duration" label={t.duration} value={f.training.duration} onChangeText={(v) => setTraining({ duration: v })} maxLength={100} {...labelProps} />
            <Field id="fe-tr-topics" label={t.topics} value={f.training.topics} onChangeText={(v) => setTraining({ topics: v })} multiline minHeight={80} maxLength={500} {...labelProps} />
            <Field id="fe-tr-lang" label={t.trainingLanguage} value={f.training.language} onChangeText={(v) => setTraining({ language: v })} maxLength={100} {...labelProps} />
            <Field id="fe-tr-batch" label={t.batchSize} value={f.training.batch_size} onChangeText={(v) => setTraining({ batch_size: v })} maxLength={50} {...labelProps} />
            <Field id="fe-tr-fee" label={t.feeText} value={f.training.fee_text} onChangeText={(v) => setTraining({ fee_text: v })} maxLength={100} {...labelProps} />
            <MonthPicker label={t.trainingMonths} value={f.training.months} onChange={(v) => setTraining({ months: v })} lang={lang} labelFont={lf.semibold} />
          </View>
        ) : null}
        <Checkbox checked={f.training.course_available} onChange={(v) => setTraining({ course_available: v })} label={t.onlineCourse} fontFamily={hiFont} />
        {f.training.course_available ? (
          <View style={{ gap: spacing.md }}>
            <Text style={{ fontFamily: lf.body, fontSize: 13.5, color: colors.inkSoft }}>{t.courseNote}</Text>
            <Field id="fe-course-title" label={t.courseTitle} value={f.training.course_title} onChangeText={(v) => setTraining({ course_title: v })} maxLength={200} {...labelProps} />
            <Field id="fe-course-lang" label={t.courseLanguage} value={f.training.course_language} onChangeText={(v) => setTraining({ course_language: v })} maxLength={100} {...labelProps} />
          </View>
        ) : null}
      </Collapsible>

      {/* 9. Photos & videos */}
      <Collapsible title={t.secMedia} font={lf.heading} flag={sectionHasError("media")}>
        <View style={{ gap: spacing.sm }}>
          <FieldLabel label={t.gallery} help={t.galleryHelp(maxGallery)} {...labelProps} />
          {f.gallery.length === 0 ? <Text style={{ fontFamily: lf.body, fontSize: 14, color: colors.inkSoft }}>{t.noPhotos}</Text> : null}
          {f.gallery.map((g, i) => {
            const isCover = f.cover_url === g.url;
            const setItem = (patch: Partial<GalleryItem>) => setF((p) => ({ ...p, gallery: p.gallery.map((x) => (x.url === g.url ? { ...x, ...patch } : x)) }));
            return (
              <View key={g.url} style={{ flexDirection: "row", gap: spacing.md, borderWidth: 1, borderColor: isCover ? colors.brand : colors.border, borderRadius: radius.md, padding: spacing.sm, backgroundColor: colors.paper, flexWrap: "wrap" }}>
                <PhotoThumb
                  uri={g.url}
                  alt={g.caption || `${t.gallery} ${i + 1}`}
                  size={96}
                  selected={isCover}
                  badge={isCover ? t.isCover : null}
                  onRemove={() => setF((p) => {
                    const gallery = p.gallery.filter((x) => x.url !== g.url);
                    return { ...p, gallery, cover_url: p.cover_url === g.url ? gallery[0]?.url ?? null : p.cover_url };
                  })}
                  removeLabel={`${t.remove} ${t.gallery} ${i + 1}`}
                />
                <View style={{ flex: 1, minWidth: 200, gap: spacing.sm }}>
                  <Field id={`fe-cap-${i}`} label={`${t.caption} ${i + 1}`} value={g.caption} onChangeText={(v) => setItem({ caption: v })} maxLength={300} {...labelProps} />
                  {lists.photoCategories.length > 0 ? (
                    <Select
                      id={`fe-pcat-${i}`}
                      label={t.photoCategory}
                      value={g.photo_category_id}
                      onChange={(v) => setItem({ photo_category_id: v })}
                      options={lists.photoCategories.map((x) => ({ value: x.id, label: itemLabel(x, lang) }))}
                      placeholder={t.noCategory}
                      {...labelProps}
                    />
                  ) : null}
                  {!isCover ? <Button label={t.setCover} variant="outline" onPress={() => upd({ cover_url: g.url })} /> : null}
                </View>
              </View>
            );
          })}
          {canPickImages ? (
            <Button
              label={uploading === "gallery" ? t.uploading : t.addPhotos}
              variant="outline"
              loading={uploading === "gallery"}
              disabled={!!uploading || f.gallery.length >= maxGallery}
              onPress={addGallery}
            />
          ) : (
            <Text style={{ fontFamily: lf.body, fontSize: 13.5, color: colors.inkSoft }}>{t.photosNative}</Text>
          )}
        </View>

        <View style={{ gap: spacing.sm }}>
          <FieldLabel label={t.videos} {...labelProps} />
          {f.videos.map((v, i) => {
            const setRow = (patch: Partial<VideoRow>) => setF((p) => ({ ...p, videos: p.videos.map((x) => (x.key === v.key ? { ...x, ...patch } : x)) }));
            return (
              <View key={v.key} style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.md, backgroundColor: colors.paper }}>
                <Field id={`fe-vid-url-${v.key}`} label={`${t.videoUrl} ${i + 1}`} value={v.url} onChangeText={(x) => setRow({ url: x })} autoCapitalize="none" inputMode="url" maxLength={300} placeholder="https://youtu.be/…" error={errors[`video-${v.key}`]} {...labelProps} />
                <Field id={`fe-vid-title-${v.key}`} label={t.videoTitle} value={v.title} onChangeText={(x) => setRow({ title: x })} maxLength={300} {...labelProps} />
                {removeBtn(() => setF((p) => ({ ...p, videos: p.videos.filter((x) => x.key !== v.key) })), `${t.remove} ${t.videoUrl} ${i + 1}`)}
              </View>
            );
          })}
          {f.videos.length < 20 ? <Button label={`+ ${t.addVideo}`} variant="secondary" onPress={() => upd({ videos: [...f.videos, { key: nextKey(), url: "", title: "" }] })} /> : null}
        </View>
      </Collapsible>

      {uploadErrors.length > 0 ? (
        <View accessibilityRole="alert" aria-live="polite" style={{ gap: 4 }}>
          {uploadErrors.map((e, i) => (
            <FieldError key={i} error={e} />
          ))}
        </View>
      ) : null}

      {Object.keys(errors).length > 0 ? (
        <View accessibilityRole="alert" aria-live="polite" style={{ backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md }}>
          <Text style={{ fontFamily: lf.semibold, color: colors.danger, fontSize: 14 }}>{t.checkFields}</Text>
        </View>
      ) : null}
      {submitError ? (
        <Text accessibilityRole="alert" aria-live="polite" style={{ fontFamily: fonts.bodyMedium, color: colors.danger, fontSize: 14 }}>
          {submitError}
        </Text>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <Text style={{ fontFamily: lf.body, fontSize: 13.5, color: colors.inkSoft, lineHeight: textLH }}>{t.reviewNote}</Text>
        <Button label={submitting ? t.sending : t.submitReview} fullWidth loading={submitting} disabled={!!uploading} onPress={submit} />
      </View>
    </View>
  );
}
