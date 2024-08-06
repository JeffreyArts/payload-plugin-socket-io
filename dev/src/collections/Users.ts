import { CollectionConfig } from 'payload/types';

const Users: CollectionConfig = {
  slug: 'site-users',
  auth: true,
  admin: {
    useAsTitle: 'username',
  },
  fields: [
      {
          name: "username",
          type: "text",
          required: true,
          defaultValue: ({user, locale}) => {
              if (locale?.email) {
                return locale.email
              }
          }
      }
  ],
};

export default Users;