export function getClerkUserProfile(user) {
  const email =
    user.email_addresses?.find((address) => address.id === user.primary_email_address_id)
      ?.email_address ?? user.email_addresses?.[0]?.email_address;

  const fullName =
    [user.first_name, user.last_name].filter(Boolean).join(" ") ||
    user.username ||
    (email ? email.split("@")[0] : "New user");

  return {
    clerkId: user.id,
    ...(email ? { email } : {}),
    fullName,
    profilePic: user.image_url ?? "",
  };
}
