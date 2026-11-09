export function getClerkUserProfile(user) {
  const emailAddresses = user.email_addresses ?? user.emailAddresses ?? [];
  const primaryEmailAddressId =
    user.primary_email_address_id ?? user.primaryEmailAddressId;
  const email =
    emailAddresses.find((address) => address.id === primaryEmailAddressId)?.email_address ??
    emailAddresses.find((address) => address.id === primaryEmailAddressId)?.emailAddress ??
    emailAddresses[0]?.email_address ??
    emailAddresses[0]?.emailAddress;
  const firstName = user.first_name ?? user.firstName;
  const lastName = user.last_name ?? user.lastName;
  const username = user.username;
  const imageUrl = user.image_url ?? user.imageUrl;

  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    username ||
    (email ? email.split("@")[0] : `User ${user.id.slice(-4)}`);

  return {
    clerkId: user.id,
    ...(email ? { email } : {}),
    fullName,
    profilePic: imageUrl ?? "",
  };
}
