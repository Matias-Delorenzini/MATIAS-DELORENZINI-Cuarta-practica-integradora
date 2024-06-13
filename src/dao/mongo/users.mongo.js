import UsersModel from '../models/users.schema.js';

class Users {
    post = async(user) => {
        try {
            const newUser = new UsersModel(user);
            const savedUser = await newUser.save();
            return savedUser;
        } catch (error) {
            throw error;
        }
    }

    getOne = async(email) => {
        try {
            const user = await UsersModel.findOne({ email });
            return user;
        } catch (error) {
            throw error;
        }
    }

    putPassword = async (email, newPasswordHashed) => {
        try {
          const user = await UsersModel.findOne({ email });      
          user.password = newPasswordHashed;
          await user.save();
      
          return { message: 'Password updated successfully' };
        } catch (error) {
          throw error;
        }
    }

    putRole = async (email, newRole) => {
        try {
          const user = await UsersModel.findOne({ email });
          user.role = newRole;
          await user.save();
      
          return { message: 'Role updated successfully' };
        } catch (error) {
          throw error;
        }
    }

    delete = async (email) => {
        try {
            const result = await UsersModel.findOneAndDelete({ email: email });
            if (!result) {
                console.log(`No se encontró el usuario con email ${email} así que no se eliminó`);
            }
            return { message: `Usuario con el email ${email} eliminado correctamente` };
        } catch (error) {
            throw error;
        }
    }

    dateupdate = async (email) => {
        try {
            const user = await UsersModel.findOne({ email });
            user.last_connection = Date.now();
            await user.save();
            return { message: 'last_connection updated successfully' };
        } catch (error) {
            throw error;
        }
    }

    putdocs = async (email, documentType) => {
        try {
            const user = await UsersModel.findOne({ email });
    
            if (!user) {
                throw new Error('User not found');
            }
    
            const existingDocumentIndex = user.documents.findIndex(doc => doc.name.includes(documentType));
    
            if (existingDocumentIndex !== -1) {
                user.documents.splice(existingDocumentIndex, 1);
            }
    
            user.documents.push({
                name: `${user.email}-${documentType}.pdf`,
                reference: `/public/documents/${documentType}/${user.email}-${documentType}.pdf`
            });
    
            await user.save();
    
            return { message: 'Documents updated successfully' };
        } catch (error) {
            throw error;
        }
    }   
}

export default Users;