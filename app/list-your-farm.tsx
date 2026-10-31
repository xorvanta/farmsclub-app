import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Text, View, type ScrollView } from "react-native";
import { Link } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { SeoHead } from "@/components/SeoHead";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Checkbox } from "@/components/Checkbox";
import { Honeypot } from "@/components/Honeypot";
import { Turnstile } from "@/components/Turnstile";
import { LoadingState } from "@/components/StateViews";
import { Field, FieldLabel, FieldError } from "@/components/form/Field";
import { Select } from "@/components/form/Select";
import { MultiSelect, ToggleChip } from "@/components/form/MultiSelect";
import { LangSwitch, useFormLang, useLangFonts } from "@/components/form/LangSwitch";
import { PhotoThumb, pickCompressedPhotos, type PickedPhoto } from "@/components/form/PhotoThumb";
import { useTheme } from "@/constants/theme-context";
import { errorMessage, fcApi } from "@/lib/api";
import { canPickImages, revokePreview } from "@/lib/images";
import { normalizeIndianMobile } from "@/lib/format";
import { useBotFields } from "@/lib/useBotFields";
import { FORM_TEXT, itemLabel } from "@/lib/farmFormText";
import type { FarmRegistrationResult, FcLists } from "@/lib/types";

const MOBILE_RE = /^[6-9]\d{9}$/;
const LAND_RE = /^\d{1,7}(\.\d{1,2})?$/;
const MAX_PHOTOS = 3;

type ErrKey = "ownerName" | "mobile" | "farmName" | "state" | "district" | "types" | "crops" | "land" | "consent";
const ERR_ORDER: ErrKey[] = ["ownerName", "mobile", "farmName", "state", "district", "types", "crops", "land", "consent"];

/** Storefront §7 — short "List your farm" registration (creates a Farm lead in admin), EN/HI. */
export default function ListYourFarm() {
  const { colors, fonts, spacing, radius } = useTheme();
  const [lang, setLang] = useFormLang();
  const t = FORM_TEXT[lang];
  const lf = useLangFonts(lang);
  const scrollRef = useRef<ScrollView>(null);

  const [lists, setLists] = useState<FcLists | null>(null);
  const [open, setOpen] = useState(true);
  const [hindiOn, setHindiOn] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoadFailed(false);
    setLists(null);
    Promise.all([fcApi.getLists(), fcApi.getContent().catch(() => null)])
      .then(([l, c]) => {
        if (!alive) return;
        setLists(l);
        if (c && c.registrationOpen === false) setOpen(false);
        if (c && c.hindiOnRegistration === false) setHindiOn(false);
      })
      .catch(() => alive && setLoadFailed(true));
    return () => {
      alive = false;
    };
  }, [attempt]);

  const bot = useBotFields();
  const [ownerName, setOwnerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [onWhatsapp, setOnWhatsapp] = useState(true);
  const [farmName, setFarmName] = useState("");
  const [stateId, setStateId] = useState<number | null>(null);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [typeIds, setTypeIds] = useState<number[]>([]);
  const [cropIds, setCropIds] = useState<number[]>([]);
  const [otherCrops, setOtherCrops] = useState("");
  const [land, setLand] = useState("");
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [photoNote, setPhotoNote] = useState<string | null>(null);
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [training, setTraining] = useState<boolean | null>(null);
  const [bulk, setBulk] = useState(false);
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<Partial<Record<ErrKey, true>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<FarmRegistrationResult | null>(null);

  const cardY = useRef(0);
  const formY = useRef(0);
  const fieldY = useRef<Partial<Record<ErrKey, number>>>({});

  // Previews are blob: URLs — release them when the page goes away.
  const photosRef = useRef(photos);
  photosRef.current = photos;
  useEffect(() => () => photosRef.current.forEach((p) => revokePreview(p.preview)), []);

  const state = useMemo(() => lists?.states.find((s) => s.id === stateId) ?? null, [lists, stateId]);
  const districtRequired = !!state && state.districts.length > 0;

  const errText: Record<ErrKey, string> = {
    ownerName: t.errOwnerName,
    mobile: t.errMobile,
    farmName: t.errFarmName,
    state: t.errState,
    district: t.errDistrict,
    types: t.errFarmType,
    crops: t.errCrops,
    land: t.errLand,
    consent: t.errConsent,
  };
  const err = (k: ErrKey) => (errors[k] ? errText[k] : undefined);
  const clearErr = (k: ErrKey) => errors[k] && setErrors((e) => ({ ...e, [k]: undefined }));

  function validate() {
    const e: Partial<Record<ErrKey, true>> = {};
    if (!ownerName.trim()) e.ownerName = true;
    if (!MOBILE_RE.test(normalizeIndianMobile(mobile))) e.mobile = true;
    if (!farmName.trim()) e.farmName = true;
    if (stateId == null) e.state = true;
    if (districtRequired && districtId == null) e.district = true;
    if (!typeIds.length) e.types = true;
    if (!cropIds.length && !otherCrops.trim()) e.crops = true;
    if (land.trim() && !LAND_RE.test(land.trim())) e.land = true;
    if (!consent) e.consent = true;
    return e;
  }

  async function addPhotos() {
    setPhotoNote(null);
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) {
      setPhotoNote(t.photoMax(MAX_PHOTOS));
      return;
    }
    const { photos: picked, tooBig, unreadable } = await pickCompressedPhotos(room);
    if (tooBig) setPhotoNote(t.photoTooBig);
    else if (unreadable) setPhotoNote(t.photoUnreadable);
    if (picked.length) setPhotos((p) => [...p, ...picked].slice(0, MAX_PHOTOS));
  }

  function removePhoto(i: number) {
    setPhotos((p) => {
      revokePreview(p[i]?.preview);
      return p.filter((_, j) => j !== i);
    });
  }

  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitError(null);
    const found = validate();
    setErrors(found);
    const first = ERR_ORDER.find((k) => found[k]);
    if (first) {
      const y = cardY.current + formY.current + (fieldY.current[first] ?? 0) - 24;
      scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fcApi.registerFarm(
        {
          ...bot.fields(),
          owner_name: ownerName.trim(),
          mobile: normalizeIndianMobile(mobile),
          mobile_is_whatsapp: onWhatsapp,
          farm_name: farmName.trim(),
          state_id: stateId as number,
          ...(districtId != null ? { district_id: districtId } : {}),
          farm_type_ids: typeIds,
          crop_ids: cropIds,
          ...(otherCrops.trim() ? { other_crops: otherCrops.trim() } : {}),
          ...(land.trim() ? { total_land: land.trim() } : {}),
          service_ids: serviceIds,
          offers_training: training === true,
          bulk_interest: bulk,
          consent: true,
        },
        photos.map((p) => p.photo),
      );
      setResult(res.data);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (e) {
      setSubmitError(errorMessage(e));
      bot.reset();
    } finally {
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting, ownerName, mobile, onWhatsapp, farmName, stateId, districtId, typeIds, cropIds, otherCrops, land, serviceIds, training, bulk, consent, photos, bot, districtRequired]);

  const header = (
    <LinearGradient
      colors={["#081E12", "#123824"]}
      style={{
        padding: spacing.xl,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: "rgba(229,180,98,0.28)",
        gap: spacing.md,
        marginBottom: spacing.xl,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: radius.pill,
            backgroundColor: "rgba(229,180,98,0.14)",
            borderWidth: 1,
            borderColor: "rgba(229,180,98,0.35)",
          }}
        >
          <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: "#E5B462", letterSpacing: 1 }}>
            GROWER & NURSERY ONBOARDING · FREE
          </Text>
        </View>
        {hindiOn && <LangSwitch lang={lang} onChange={setLang} />}
      </View>
      <Text accessibilityRole="header" aria-level={1} style={{ fontFamily: lf.display, fontSize: 28, lineHeight: lang === "hi" ? 40 : 34, color: "#FFFFFF" }}>
        {t.regTitle}
      </Text>
      <Text style={{ fontFamily: lf.body, fontSize: 15, lineHeight: lang === "hi" ? 26 : 22, color: "rgba(255,255,255,0.78)" }}>
        {t.regIntro}
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
        {[
          { code: "01", text: lang === "hi" ? "2 मिनट का फ़ॉर्म" : "2-Min Form" },
          { code: "02", text: lang === "hi" ? "टीम सत्यापन" : "Team Verification" },
          { code: "03", text: lang === "hi" ? "थोक ख़रीददार नेटवर्क" : "Pan-India B2B Buyers" },
        ].map((step) => (
          <View
            key={step.code}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: radius.pill,
              backgroundColor: "rgba(255,255,255,0.08)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.14)",
            }}
          >
            <Text style={{ fontFamily: fonts.mono, fontSize: 10.5, color: "#E5B462" }}>{step.code}</Text>
            <Text style={{ fontFamily: lf.semibold, fontSize: 11.5, color: "#FFFFFF" }}>{step.text}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );

  let body: React.ReactNode;
  if (result) {
    const dup = result.outcome === "DUPLICATE";
    body = (
      <View style={{ alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md }} accessibilityLiveRegion="polite" aria-live="polite">
        <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: dup ? colors.infoSoft : colors.successSoft, alignItems: "center", justifyContent: "center" }} aria-hidden>
          <Text style={{ fontSize: 26, color: dup ? colors.info : colors.success }}>{dup ? "i" : "✓"}</Text>
        </View>
        <Text accessibilityRole="header" style={{ fontFamily: lf.display, fontSize: 24, color: colors.ink, textAlign: "center", lineHeight: lang === "hi" ? 36 : 30 }}>
          {dup ? t.duplicateTitle : t.successTitle}
        </Text>
        <Text style={{ fontFamily: lf.body, fontSize: 15.5, color: colors.inkSoft, textAlign: "center", maxWidth: 440, lineHeight: lang === "hi" ? 26 : 22 }}>
          {dup ? t.duplicateBody : t.successBody}
        </Text>
        {!dup && result.photos_failed > 0 ? (
          <Text style={{ fontFamily: lf.body, fontSize: 14, color: colors.inkSoft, textAlign: "center", maxWidth: 440 }}>{t.photosFailed}</Text>
        ) : null}
        <View style={{ marginTop: spacing.md }}>
          <Link href="/farms" asChild>
            <Button label={t.exploreFarms} />
          </Link>
        </View>
      </View>
    );
  } else if (loadFailed) {
    body = (
      <View style={{ alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md }}>
        <Text style={{ fontFamily: lf.body, fontSize: 15, color: colors.inkSoft, textAlign: "center" }}>{t.loadError}</Text>
        <Button label={t.retry} variant="outline" onPress={() => setAttempt((n) => n + 1)} />
      </View>
    );
  } else if (!lists) {
    body = <LoadingState label={t.loading} />;
  } else if (!open) {
    body = (
      <View style={{ alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.md }}>
        <Text accessibilityRole="header" style={{ fontFamily: lf.display, fontSize: 22, color: colors.ink, textAlign: "center" }}>{t.pausedTitle}</Text>
        <Text style={{ fontFamily: lf.body, fontSize: 15, color: colors.inkSoft, textAlign: "center", maxWidth: 420 }}>{t.pausedBody}</Text>
        <Link href="/farms" asChild>
          <Button label={t.exploreFarms} />
        </Link>
      </View>
    );
  } else {
    const errorCount = ERR_ORDER.filter((k) => errors[k]).length;
    const slot = (k: ErrKey) => (e: { nativeEvent: { layout: { y: number } } }) => {
      fieldY.current[k] = e.nativeEvent.layout.y;
    };
    const labelProps = { labelFont: lf.semibold, helpFont: lf.body };

    body = (
      <View style={{ gap: spacing.xl }} onLayout={(e) => (formY.current = e.nativeEvent.layout.y)}>
        <Honeypot value={bot.hp} onChangeText={bot.setHp} />

        <View onLayout={slot("ownerName")}>
          <Field id="reg-owner" label={t.ownerName} value={ownerName} onChangeText={(v) => { setOwnerName(v); clearErr("ownerName"); }} required maxLength={160} autoComplete="name" error={err("ownerName")} {...labelProps} />
        </View>

        <View onLayout={slot("mobile")} style={{ gap: 4 }}>
          <Field
            id="reg-mobile"
            label={t.mobile}
            help={t.mobileHelp}
            value={mobile}
            onChangeText={(v) => { setMobile(v.replace(/[^\d+\s-]/g, "")); clearErr("mobile"); }}
            required
            keyboardType="phone-pad"
            inputMode="tel"
            autoComplete="tel"
            maxLength={16}
            placeholder="98765 43210"
            error={err("mobile")}
            {...labelProps}
          />
          <Checkbox checked={onWhatsapp} onChange={setOnWhatsapp} label={t.onWhatsapp} fontFamily={lang === "hi" ? lf.semibold : undefined} />
        </View>

        <View onLayout={slot("farmName")}>
          <Field id="reg-farm" label={t.farmName} value={farmName} onChangeText={(v) => { setFarmName(v); clearErr("farmName"); }} required maxLength={200} error={err("farmName")} {...labelProps} />
        </View>

        <View onLayout={slot("state")}>
          <Select
            id="reg-state"
            label={t.state}
            value={stateId}
            onChange={(v) => {
              setStateId(v);
              setDistrictId(null);
              clearErr("state");
              clearErr("district");
            }}
            options={lists.states.map((s) => ({ value: s.id, label: s.name }))}
            placeholder={t.chooseState}
            required
            error={err("state")}
            {...labelProps}
          />
        </View>

        {!state || state.districts.length > 0 ? (
          <View onLayout={slot("district")}>
            <Select
              id="reg-district"
              label={t.district}
              value={districtId}
              onChange={(v) => { setDistrictId(v); clearErr("district"); }}
              options={(state?.districts ?? []).map((d) => ({ value: d.id, label: d.name }))}
              placeholder={state ? t.chooseDistrict : t.chooseStateFirst}
              disabled={!state}
              required
              error={err("district")}
              {...labelProps}
            />
          </View>
        ) : null}

        <View onLayout={slot("types")}>
          <MultiSelect
            id="reg-types"
            label={t.farmType}
            help={t.farmTypeHelp}
            options={lists.farmTypes.map((x) => ({ value: x.id, label: itemLabel(x, lang) }))}
            selected={typeIds}
            onChange={(v) => { setTypeIds(v); clearErr("types"); }}
            required
            error={err("types")}
            chipFont={lang === "hi" ? lf.semibold : undefined}
            {...labelProps}
          />
        </View>

        <View onLayout={slot("crops")} style={{ gap: spacing.md }}>
          <MultiSelect
            id="reg-crops"
            label={t.crops}
            help={t.cropsHelp}
            options={lists.crops.map((x) => ({ value: x.id, label: itemLabel(x, lang) }))}
            selected={cropIds}
            onChange={(v) => { setCropIds(v); clearErr("crops"); }}
            required
            searchable
            searchPlaceholder={t.searchCrops}
            noMatches={t.noMatches}
            showAllLabel={t.showAll}
            showLessLabel={t.showLess}
            error={err("crops")}
            chipFont={lang === "hi" ? lf.semibold : undefined}
            {...labelProps}
          />
          <Field id="reg-other-crops" label={t.otherCrops} help={t.otherCropsHelp} value={otherCrops} onChangeText={(v) => { setOtherCrops(v); clearErr("crops"); }} maxLength={300} {...labelProps} />
        </View>

        <View onLayout={slot("land")}>
          <Field
            id="reg-land"
            label={t.totalLand}
            help={t.totalLandHelp}
            value={land}
            onChangeText={(v) => { setLand(v.replace(/[^\d.]/g, "")); clearErr("land"); }}
            keyboardType="decimal-pad"
            inputMode="decimal"
            maxLength={10}
            error={err("land")}
            {...labelProps}
          />
        </View>

        <View style={{ gap: spacing.sm }}>
          <FieldLabel label={t.photos} help={canPickImages ? t.photosHelp : undefined} labelFont={lf.semibold} helpFont={lf.body} />
          {canPickImages ? (
            <>
              {photos.length > 0 ? (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
                  {photos.map((p, i) => (
                    <PhotoThumb key={p.preview ?? i} uri={p.preview} alt={`${t.photos} ${i + 1}`} onRemove={() => removePhoto(i)} removeLabel={`${t.remove} ${i + 1}`} />
                  ))}
                </View>
              ) : null}
              {photos.length < MAX_PHOTOS ? <Button label={t.addPhotos} variant="outline" onPress={addPhotos} /> : null}
              {photoNote ? <FieldError error={photoNote} font={lang === "hi" ? lf.semibold : undefined} /> : null}
            </>
          ) : (
            <Text style={{ fontFamily: lf.body, fontSize: 13.5, color: colors.inkSoft }}>{t.photosNative}</Text>
          )}
        </View>

        {lists.services.length > 0 ? (
          <MultiSelect
            id="reg-services"
            label={t.services}
            options={lists.services.map((x) => ({ value: x.id, label: itemLabel(x, lang) }))}
            selected={serviceIds}
            onChange={setServiceIds}
            chipFont={lang === "hi" ? lf.semibold : undefined}
            {...labelProps}
          />
        ) : null}

        <View style={{ gap: 8 }}>
          <FieldLabel id="reg-training-label" label={t.training} labelFont={lf.semibold} />
          <View style={{ flexDirection: "row", gap: 8 }} accessibilityRole="radiogroup" aria-labelledby="reg-training-label">
            <ToggleChip label={t.yes} selected={training === true} onPress={() => setTraining(training === true ? null : true)} font={lang === "hi" ? lf.semibold : undefined} />
            <ToggleChip label={t.no} selected={training === false} onPress={() => setTraining(training === false ? null : false)} font={lang === "hi" ? lf.semibold : undefined} />
          </View>
        </View>

        <Checkbox checked={bulk} onChange={setBulk} label={t.bulk} fontFamily={lang === "hi" ? lf.semibold : undefined} />

        <View onLayout={slot("consent")} style={{ gap: 4 }}>
          <Checkbox checked={consent} onChange={(v) => { setConsent(v); clearErr("consent"); }} label={t.consent} error={err("consent")} fontFamily={lang === "hi" ? lf.semibold : undefined}>
            <Text style={{ fontFamily: lang === "hi" ? lf.semibold : fonts.body, fontSize: 14, color: colors.ink, lineHeight: lang === "hi" ? 24 : 20 }}>
              {t.consent} <Text style={{ color: colors.danger }}>*</Text>
            </Text>
          </Checkbox>
          <Link
            href="/privacy"
            {...(Platform.OS === "web" ? { target: "_blank", rel: "noopener" } : {})}
            style={{ marginLeft: 34, fontFamily: lang === "hi" ? lf.semibold : fonts.bodySemiBold, fontSize: 13.5, color: colors.brand, textDecorationLine: "underline", paddingVertical: 8 }}
          >
            {t.privacyLink}
          </Link>
        </View>

        <Turnstile onToken={bot.setToken} resetKey={bot.resetKey} language={lang} />

        {errorCount > 0 ? (
          <View accessibilityRole="alert" aria-live="polite" style={{ backgroundColor: colors.dangerSoft, borderRadius: radius.md, padding: spacing.md }}>
            <Text style={{ fontFamily: lang === "hi" ? lf.semibold : fonts.bodySemiBold, color: colors.danger, fontSize: 13.5 }}>{t.checkFields}</Text>
          </View>
        ) : null}
        {submitError ? (
          <Text accessibilityRole="alert" aria-live="polite" style={{ fontFamily: fonts.bodyMedium, color: colors.danger, fontSize: 14 }}>
            {submitError}
          </Text>
        ) : null}

        <Button label={submitting ? t.sending : t.submit} fullWidth loading={submitting} disabled={!bot.ready} onPress={submit} />
      </View>
    );
  }

  return (
    <AppShell
      keyboardAware
      hideBottomNav
      scrollRef={scrollRef}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, maxWidth: 680, width: "100%", alignSelf: "center" }}
    >
      <SeoHead title="List your farm · FarmsClub" description="List your farm on FarmsClub for free — share your farm's story with buyers and future farmers across India. Takes about 2 minutes." />
      {header}
      <View
        onLayout={(e) => (cardY.current = e.nativeEvent.layout.y)}
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.xl,
          padding: spacing.lg,
        }}
      >
        {body}
      </View>
    </AppShell>
  );
}
