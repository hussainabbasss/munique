"use server";

import { fetchRegistrationProfile } from "@/lib/admin/registration-profile";

export async function getRegistrationProfileAction(registrationUuid: string) {
  if (!registrationUuid) {
    return { error: "Missing registration id." };
  }
  return fetchRegistrationProfile(registrationUuid);
}
