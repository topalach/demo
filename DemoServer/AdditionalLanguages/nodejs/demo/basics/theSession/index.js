//region Usings
//endregion
const { documentStore } = require('../../common/docStoreHolder');

async function run () {
    //region Demo
    //region Step_1
    const session = documentStore.openSession('YourDatabaseName');
    //endregion

    //region Step_2
    //   Run your business logic:
    //
    //   Store documents
    //   Load and Modify documents
    //   Query indexes & collections
    //   Delete documents
    //endregion

    //region Step_3
    await session.saveChanges();
    //endregion
    //endregion
}

module.exports = { run };
