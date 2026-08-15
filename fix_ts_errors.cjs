const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

async function main() {
  const project = new Project({
    tsConfigFilePath: './tsconfig.json',
    skipAddingFilesFromTsConfig: true
  });
  project.addSourceFilesAtPaths('src/store/modules/*.ts');

  // Step 1: Find all exported properties from all stores
  const storeProps = {}; // propertyName -> storeName

  for (const sourceFile of project.getSourceFiles()) {
    const storeName = sourceFile.getBaseNameWithoutExtension();
    // Look for create(...)
    const callExprs = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);
    for (const callExpr of callExprs) {
      if (callExpr.getExpression().getText() === 'create' || callExpr.getExpression().getText().startsWith('create<')) {
        const args = callExpr.getArguments();
        if (args.length > 0) {
          const arrowFunc = args[0];
          if (arrowFunc.getKind() === SyntaxKind.ArrowFunction) {
            let body = arrowFunc.getBody();
            if (body.getKind() === SyntaxKind.ParenthesizedExpression) {
              body = body.getExpression();
            }
            if (body.getKind() === SyntaxKind.ObjectLiteralExpression) {
              body.getProperties().forEach(prop => {
                if (prop.getKind() === SyntaxKind.PropertyAssignment || prop.getKind() === SyntaxKind.MethodDeclaration) {
                  const propName = prop.getName();
                  storeProps[propName] = storeName;
                }
              });
            }
          }
        }
      }
    }
  }

  console.log("Found properties:");
  console.log(Object.keys(storeProps).length, "properties mapped.");

  // Missing names from tsc_errors.log
  const missingNames = [
    'useAccountingStore', 'store', 'st', 'view', 'setView', 'calculateMargin', 'filteredProducts', 'ilableCustomFields', 'capturePhoto', 'currentStatus', 'dataToExport', 'setIsEntriesLoading', 'setPaginatedEntries', 'setEntryCount', 'setAccountBalances', 'setPartnerBalances', 'getGeneralLedger', 'allJournalLines', 'allEntries', 'accountsRef', 'setAllAccounts', 'setLocalOnlyLines', 'refreshBalances', 'accountBalances', 'fetchInitialData', 'setIsContactsLoading', 'setPaginatedContacts', 'setContactCount', 'partnerBalances', 'contactsRef', 'setLocalOnlyContacts', 'DEFAULT_USERS', 'SYSTEM_ROLES', 'roles', 'User', 'contacts', 'allLoans', 'allAttendance', 'users', 'setLocalOnlyLoans', 'setIsProductsLoading', 'setPaginatedProducts', 'setProductCount', 'setTotalProductsCount', 'setAllProducts', 'searchTimeoutRef', 'allInventoryTransactions', 'allProductCosts', 'paginatedProducts', 'products', 'allInventoryAdjustments', 'allWarehouses', 'generateNextNumber', 'getAccountIdByCode', 'addJournalEntry', 'setAllBrands', 'setAllCategories', 'setLocalOnlyProducts', 'productsRef', 'brandsRef', 'categoriesRef', 'setLocalOnlyBrands', 'setLocalOnlyCategories', 'getChangeLog', 'setAllInventoryTransactions', 'setIsBillsLoading', 'setPaginatedBills', 'setBillCount', 'allBills', 'allPayments', 'setAllPayments', 'setAllInvoices', 'setAllBills', 'accounts', 'setLocalOnlyPayments', 'setLocalOnlyInvoices', 'setLocalOnlyBills', 'clearFetchCache', 'setLocalOnlyInventoryTransactions', 'paginatedBills', 'postBill', 'postPayment', 'recordLoanPayment', 'setIsInvoicesLoading', 'setPaginatedInvoices', 'setInvoiceCount', 'allTasks', 'allBrands', 'setCompanies', 'setActiveCompanyIds', 'INITIAL_ACCOUNTS', 'setAllWarehouses', 'setUsers', 'setCurrentUser'
  ];

  // We want to replace Identifiers that match missing names, provided they are unresolved.
  let totalReplaced = 0;
  for (const sourceFile of project.getSourceFiles()) {
    const currentStore = sourceFile.getBaseNameWithoutExtension();
    const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
    let replacements = [];

    for (const id of identifiers) {
      const text = id.getText();
      if (!missingNames.includes(text)) continue;

      const parent = id.getParent();
      // Skip if it's part of a property assignment left side, or parameter declaration
      if (parent.getKind() === SyntaxKind.PropertyAssignment && parent.getNameNode() === id) continue;
      if (parent.getKind() === SyntaxKind.Parameter) continue;
      if (parent.getKind() === SyntaxKind.VariableDeclaration && parent.getNameNode() === id) continue;
      if (parent.getKind() === SyntaxKind.PropertyAccessExpression && parent.getNameNode() === id) continue; // obj.prop
      if (parent.getKind() === SyntaxKind.MethodDeclaration || parent.getKind() === SyntaxKind.FunctionDeclaration) continue;

      // Check if it's unresolved by ts-morph
      const symbol = id.getSymbol();
      const type = project.getTypeChecker();
      
      // We will check if there is a local declaration. If there isn't, or if it points to an error type
      const decls = symbol ? symbol.getDeclarations() : [];
      if (decls.length === 0) {
        // It's unresolved!
        let targetStore = storeProps[text];
        if (!targetStore) {
          // If not in storeProps, check if it's defined in core
          if (['accountsRef','productsRef','categoriesRef','brandsRef','contactsRef','searchTimeoutRef'].includes(text)) {
             // Let's just prefix with get() assuming they are locally ref defined or we will add them.
             targetStore = currentStore;
          } else {
             targetStore = 'useAccountingCoreStore'; // Default assumption
          }
        }

        let prefix = '';
        if (targetStore === currentStore) {
          prefix = 'get().';
        } else if (targetStore === 'useAccountingCoreStore') {
          prefix = 'useAccountingCoreStore.getState().';
          
          // Add import if not present
          const importDecl = sourceFile.getImportDeclaration(d => d.getModuleSpecifierValue() === './useAccountingCoreStore');
          if (!importDecl) {
             sourceFile.addImportDeclaration({
                namedImports: ['useAccountingCoreStore'],
                moduleSpecifier: './useAccountingCoreStore'
             });
          }
        } else {
          // It belongs to another domain store. To avoid circular deps, we should force it through Core or just use get().
          console.warn(`WARNING: ${text} in ${currentStore} belongs to ${targetStore}. Using Core state as fallback.`);
          prefix = 'useAccountingCoreStore.getState().';
        }
        
        replacements.push({ node: id, text: prefix + text });
      }
    }
    
    // Apply replacements from back to front to avoid position shifting
    replacements.sort((a, b) => b.node.getStart() - a.node.getStart());
    
    let fileText = sourceFile.getFullText();
    for (const rep of replacements) {
       fileText = fileText.substring(0, rep.node.getStart()) + rep.text + fileText.substring(rep.node.getEnd());
    }
    
    fs.writeFileSync(sourceFile.getFilePath(), fileText);
    totalReplaced += replacements.length;
    console.log(`Replaced ${replacements.length} unresolved identifiers in ${currentStore}`);
  }
  
  console.log(`Total replaced: ${totalReplaced}`);
}

main().catch(console.error);
