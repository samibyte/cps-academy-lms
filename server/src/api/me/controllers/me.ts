import type { Core } from "@strapi/strapi";

const USER_MODEL_UID = "plugin::users-permissions.user";

type MeController = {
  updateAvatar: (ctx: any) => Promise<void>;
};

export default ({ strapi }: { strapi: Core.Strapi }): MeController => ({
  async updateAvatar(ctx: any): Promise<void> {
    const authUser = ctx.state.user;

    if (!authUser?.id) {
      ctx.unauthorized("You are not authenticated.");
      return;
    }

    const avatar = ctx.request.body?.avatar;

    if (avatar === undefined || avatar === null || avatar === "") {
      ctx.badRequest("avatar is required.");
      return;
    }

    try {
      const currentUser = await strapi.documents(USER_MODEL_UID).findOne({
        documentId: String(authUser.documentId ?? authUser.id),
        populate: ["avatar"],
      });

      const oldAvatarId = currentUser?.avatar?.id;

      const user = await strapi.documents(USER_MODEL_UID).update({
        documentId: String(authUser.documentId ?? authUser.id),
        data: { avatar },
        populate: ["role", "avatar"],
      });

      if (oldAvatarId && oldAvatarId !== avatar) {
        await strapi
          .plugin("upload")
          .service("upload")
          .remove({ id: oldAvatarId })
          .catch((err: unknown) => {
            strapi.log.warn(
              "[me.updateAvatar] failed to delete old avatar",
              err,
            );
          });
      }

      ctx.body = { data: user };
    } catch (error) {
      strapi.log.error("[me.updateAvatar] failed");
      strapi.log.error(error);
      ctx.internalServerError("Unable to update profile picture.");
    }
  },
});
