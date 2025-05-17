class KingstonBankAdmin:
    def __init__(self, bank_system):
        """Initialize the admin module with access to the main bank system."""
        self.bank = bank_system
        self.admin_credentials = {
            "admin@kingstonbank.com": "admin123"  # In a real system, this would be stored securely
        }
        self.logged_in_admin = None
    
    def admin_login(self, email: str, password: str) -> bool:
        """Authenticate an administrator."""
        if email in self.admin_credentials and self.admin_credentials[email] == password:
            self.logged_in_admin = email
            print(f"Administrator logged in: {email}")
            return True
        
        print("Invalid admin credentials.")
        return False
    
    def admin_logout(self) -> None:
        """Log out the current administrator."""
        if self.logged_in_admin:
            print(f"Administrator logged out: {self.logged_in_admin}")
            self.logged_in_admin = None
        else:
            print("No administrator is currently logged in.")
    
    def list_all_customers(self) -> list:
        """List all customers in the system."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return []
        
        customers_list = []
        for customer_id, customer in self.bank.customers.items():
            customer_info = customer.copy()
            customer_info['customer_id'] = customer_id
            customers_list.append(customer_info)
        
        return customers_list
    
    def get_customer_details(self, customer_id: str) -> dict:
        """Get detailed information about a specific customer."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return None
        
        if customer_id not in self.bank.customers:
            print("Customer not found.")
            return None
        
        customer = self.bank.customers[customer_id].copy()
        customer['customer_id'] = customer_id
        
        # Get customer's accounts
        accounts = []
        for account_id, account in self.bank.accounts.items():
            if account['customer_id'] == customer_id:
                account_info = account.copy()
                account_info['account_id'] = account_id
                accounts.append(account_info)
        
        customer['accounts'] = accounts
        return customer
    
    def search_customers(self, search_term: str) -> list:
        """Search for customers by name or email."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return []
        
        search_term = search_term.lower()
        results = []
        
        for customer_id, customer in self.bank.customers.items():
            if (search_term in customer['first_name'].lower() or 
                search_term in customer['last_name'].lower() or 
                search_term in customer['email'].lower()):
                
                customer_info = customer.copy()
                customer_info['customer_id'] = customer_id
                results.append(customer_info)
        
        return results
    
    def list_all_accounts(self) -> list:
        """List all accounts in the system."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return []
        
        accounts_list = []
        for account_id, account in self.bank.accounts.items():
            account_info = account.copy()
            account_info['account_id'] = account_id
            
            # Add customer name
            customer_id = account['customer_id']
            if customer_id in self.bank.customers:
                customer = self.bank.customers[customer_id]
                account_info['customer_name'] = f"{customer['first_name']} {customer['last_name']}"
                account_info['customer_email'] = customer['email']
            
            accounts_list.append(account_info)
        
        return accounts_list
    
    def get_account_details(self, account_id: str) -> dict:
        """Get detailed information about a specific account."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return None
        
        if account_id not in self.bank.accounts:
            print("Account not found.")
            return None
        
        account = self.bank.accounts[account_id].copy()
        account['account_id'] = account_id
        
        # Add customer information
        customer_id = account['customer_id']
        if customer_id in self.bank.customers:
            customer = self.bank.customers[customer_id]
            account['customer_name'] = f"{customer['first_name']} {customer['last_name']}"
            account['customer_email'] = customer['email']
        
        # Get account transactions
        transactions = []
        for transaction in self.bank.transactions:
            if transaction['account_id'] == account_id:
                transactions.append(transaction)
        
        account['transactions'] = sorted(transactions, key=lambda x: x['timestamp'], reverse=True)
        return account
    
    def freeze_account(self, account_id: str) -> bool:
        """Freeze an account to prevent transactions."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return False
        
        if account_id not in self.bank.accounts:
            print("Account not found.")
            return False
        
        account = self.bank.accounts[account_id]
        
        if account['status'] == 'frozen':
            print("Account is already frozen.")
            return False
        
        account['status'] = 'frozen'
        account['frozen_at'] = datetime.datetime.now()
        
        self.bank.save_data()
        print(f"Account {account_id} has been frozen.")
        return True
    
    def unfreeze_account(self, account_id: str) -> bool:
        """Unfreeze a frozen account."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return False
        
        if account_id not in self.bank.accounts:
            print("Account not found.")
            return False
        
        account = self.bank.accounts[account_id]
        
        if account['status'] != 'frozen':
            print("Account is not frozen.")
            return False
        
        account['status'] = 'active'
        account.pop('frozen_at', None)
        
        self.bank.save_data()
        print(f"Account {account_id} has been unfrozen.")
        return True
    
    def modify_customer_status(self, customer_id: str, status: str) -> bool:
        """Modify a customer's status (active, suspended, etc.)."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return False
        
        if customer_id not in self.bank.customers:
            print("Customer not found.")
            return False
        
        valid_statuses = ['active', 'suspended', 'closed']
        if status not in valid_statuses:
            print(f"Invalid status. Choose from: {', '.join(valid_statuses)}")
            return False
        
        customer = self.bank.customers[customer_id]
        customer['status'] = status
        
        self.bank.save_data()
        print(f"Customer {customer_id} status updated to {status}.")
        return True
    
    def adjust_account_balance(self, account_id: str, amount: float, reason: str) -> bool:
        """Adjust an account balance (for corrections, fees, etc.)."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return False
        
        if account_id not in self.bank.accounts:
            print("Account not found.")
            return False
        
        if not reason:
            print("A reason must be provided for balance adjustments.")
            return False
        
        account = self.bank.accounts[account_id]
        
        # Update balance
        previous_balance = account['balance']
        account['balance'] += amount
        
        # Record transaction
        transaction_type = 'admin_adjustment_credit' if amount > 0 else 'admin_adjustment_debit'
        
        self.bank.record_transaction(
            account_id=account_id,
            transaction_type=transaction_type,
            amount=abs(amount),
            description=f"Admin adjustment: {reason} by {self.logged_in_admin}"
        )
        
        self.bank.save_data()
        print(f"Balance adjusted from ${previous_balance:.2f} to ${account['balance']:.2f}")
        return True
    
    def generate_system_report(self, report_type: str) -> dict:
        """Generate various system reports."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return None
        
        report = {
            'generated_at': datetime.datetime.now(),
            'generated_by': self.logged_in_admin
        }
        
        if report_type == 'customer_summary':
            # Customer summary report
            total_customers = len(self.bank.customers)
            active_customers = sum(1 for c in self.bank.customers.values() if c.get('status', 'active') == 'active')
            
            report.update({
                'total_customers': total_customers,
                'active_customers': active_customers,
                'inactive_customers': total_customers - active_customers
            })
            
        elif report_type == 'account_summary':
            # Account summary report
            accounts_by_type = {}
            total_balance = 0
            
            for account in self.bank.accounts.values():
                account_type = account['account_type']
                if account_type not in accounts_by_type:
                    accounts_by_type[account_type] = {
                        'count': 0,
                        'total_balance': 0
                    }
                
                accounts_by_type[account_type]['count'] += 1
                accounts_by_type[account_type]['total_balance'] += account['balance']
                total_balance += account['balance']
            
            report.update({
                'total_accounts': len(self.bank.accounts),
                'accounts_by_type': accounts_by_type,
                'total_balance': total_balance
            })
            
        elif report_type == 'transaction_summary':
            # Transaction summary report
            transactions_by_type = {}
            total_amount = 0
            
            for transaction in self.bank.transactions:
                transaction_type = transaction['transaction_type']
                if transaction_type not in transactions_by_type:
                    transactions_by_type[transaction_type] = {
                        'count': 0,
                        'total_amount': 0
                    }
                
                transactions_by_type[transaction_type]['count'] += 1
                transactions_by_type[transaction_type]['total_amount'] += transaction['amount']
                
                if transaction_type in ['deposit', 'transfer_in']:
                    total_amount += transaction['amount']
                elif transaction_type in ['withdrawal', 'transfer_out']:
                    total_amount -= transaction['amount']
            
            report.update({
                'total_transactions': len(self.bank.transactions),
                'transactions_by_type': transactions_by_type,
                'net_transaction_amount': total_amount
            })
        
        else:
            print(f"Unknown report type: {report_type}")
            return None
        
        return report
    
    def add_admin_user(self, email: str, password: str) -> bool:
        """Add a new administrator account."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return False
        
        if email in self.admin_credentials:
            print("An admin with this email already exists.")
            return False
        
        self.admin_credentials[email] = password
        print(f"Admin user {email} added successfully.")
        return True
    
    def remove_admin_user(self, email: str) -> bool:
        """Remove an administrator account."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return False
        
        if email == self.logged_in_admin:
            print("Cannot remove your own admin account while logged in.")
            return False
        
        if email not in self.admin_credentials:
            print("Admin user not found.")
            return False
        
        del self.admin_credentials[email]
        print(f"Admin user {email} removed successfully.")
        return True
    
    def list_all_transactions(self, limit: int = 100) -> list:
        """List all transactions in the system, with optional limit."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return []
        
        sorted_transactions = sorted(self.bank.transactions, key=lambda x: x['timestamp'], reverse=True)
        
        if limit:
            sorted_transactions = sorted_transactions[:limit]
        
        # Enrich transaction data with customer and account info
        for transaction in sorted_transactions:
            # Add account type
            account_id = transaction['account_id']
            if account_id in self.bank.accounts:
                transaction['account_type'] = self.bank.accounts[account_id]['account_type']
            
            # Add customer name
            customer_id = transaction['customer_id']
            if customer_id in self.bank.customers:
                customer = self.bank.customers[customer_id]
                transaction['customer_name'] = f"{customer['first_name']} {customer['last_name']}"
        
        return sorted_transactions
    
    def search_transactions(self, search_params: dict) -> list:
        """Search transactions by various parameters."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return []
        
        transactions = self.bank.transactions
        
        # Filter by customer ID
        if 'customer_id' in search_params:
            transactions = [t for t in transactions if t['customer_id'] == search_params['customer_id']]
        
        # Filter by account ID
        if 'account_id' in search_params:
            transactions = [t for t in transactions if t['account_id'] == search_params['account_id']]
        
        # Filter by transaction type  
        if 'transaction_type' in search_params:
            transactions = [t for t in transactions if t['transaction_type'] == search_params['transaction_type']]
        
        # Filter by minimum amount
        if 'min_amount' in search_params:
            transactions = [t for t in transactions if t['amount'] >= search_params['min_amount']]
        
        # Filter by maximum amount
        if 'max_amount' in search_params:
            transactions = [t for t in transactions if t['amount'] <= search_params['max_amount']]
        
        # Filter by date range
        if 'start_date' in search_params:
            transactions = [t for t in transactions if t['timestamp'] >= search_params['start_date']]
        
        if 'end_date' in search_params:
            transactions = [t for t in transactions if t['timestamp'] <= search_params['end_date']]
        
        # Sort by timestamp (newest first)
        transactions = sorted(transactions, key=lambda x: x['timestamp'], reverse=True)
        
        # Enrich transaction data
        for transaction in transactions:
            # Add account type
            account_id = transaction['account_id']
            if account_id in self.bank.accounts:
                transaction['account_type'] = self.bank.accounts[account_id]['account_type']
            
            # Add customer name
            customer_id = transaction['customer_id']
            if customer_id in self.bank.customers:
                customer = self.bank.customers[customer_id]
                transaction['customer_name'] = f"{customer['first_name']} {customer['last_name']}"
        
        return transactions
    
    def audit_log(self, action: str, details: str) -> None:
        """Record an admin action in the audit log."""
        if not self.logged_in_admin:
            print("Admin authentication required.")
            return
        
        # In a real system, this would be stored in a separate secure database
        # For this demo, we'll just print it
        timestamp = datetime.datetime.now()
        print(f"AUDIT LOG: {timestamp} - Admin: {self.logged_in_admin} - Action: {action} - Details: {details}")


def admin_menu(bank):
    """Function to display and handle the admin menu."""
    admin = KingstonBankAdmin(bank)
    
    # Admin login
    print("\n--- Kingston Bank Admin Portal ---")
    email = input("Admin Email: ")
    password = getpass.getpass("Admin Password: ")
    
    if not admin.admin_login(email, password):
        print("Admin authentication failed.")
        return
    
    while True:
        print("\n--- Kingston Bank Admin Portal ---")
        print("1. Customer Management")
        print("2. Account Management")
        print("3. Transaction Management")
        print("4. System Reports")
        print("5. Admin User Management")
        print("6. Logout")
        print("0. Exit")
        
        choice = input("Enter your choice: ")
        
        if choice == '1':
            # Customer Management Submenu
            while True:
                print("\n--- Customer Management ---")
                print("1. List All Customers")
                print("2. Search Customers")
                print("3. View Customer Details")
                print("4. Modify Customer Status")
                print("5. Back to Main Menu")
                
                subchoice = input("Enter your choice: ")
                
                if subchoice == '1':
                    customers = admin.list_all_customers()
                    print("\n--- All Customers ---")
                    for customer in customers:
                        print(f"ID: {customer['customer_id']}")
                        print(f"Name: {customer['first_name']} {customer['last_name']}")
                        print(f"Email: {customer['email']}")
                        print(f"Status: {customer.get('status', 'active')}")
                        print("-" * 30)
                
                elif subchoice == '2':
                    search_term = input("Enter search term (name or email): ")
                    results = admin.search_customers(search_term)
                    print(f"\n--- Search Results ({len(results)}) ---")
                    for customer in results:
                        print(f"ID: {customer['customer_id']}")
                        print(f"Name: {customer['first_name']} {customer['last_name']}")
                        print(f"Email: {customer['email']}")
                        print("-" * 30)
                
                elif subchoice == '3':
                    customer_id = input("Enter customer ID: ")
                    customer = admin.get_customer_details(customer_id)
                    if customer:
                        print("\n--- Customer Details ---")
                        print(f"ID: {customer['customer_id']}")
                        print(f"Name: {customer['first_name']} {customer['last_name']}")
                        print(f"Email: {customer['email']}")
                        print(f"Phone: {customer['phone']}")
                        print(f"Address: {customer['address']}")
                        print(f"Status: {customer.get('status', 'active')}")
                        print(f"Created: {customer['created_at']}")
                        
                        if customer['accounts']:
                            print("\nAccounts:")
                            for account in customer['accounts']:
                                print(f"  - {account['account_type'].capitalize()}: ${account['balance']:.2f} ({account['status']})")
                
                elif subchoice == '4':
                    customer_id = input("Enter customer ID: ")
                    print("Status options: active, suspended, closed")
                    status = input("Enter new status: ")
                    admin.modify_customer_status(customer_id, status)
                
                elif subchoice == '5':
                    break
                
                else:
                    print("Invalid choice. Please try again.")
        
        elif choice == '2':
            # Account Management Submenu
            while True:
                print("\n--- Account Management ---")
                print("1. List All Accounts")
                print("2. View Account Details")
                print("3. Freeze Account")
                print("4. Unfreeze Account")
                print("5. Adjust Account Balance")
                print("6. Back to Main Menu")
                
                subchoice = input("Enter your choice: ")
                
                if subchoice == '1':
                    accounts = admin.list_all_accounts()
                    print("\n--- All Accounts ---")
                    for account in accounts:
                        print(f"ID: {account['account_id']}")
                        print(f"Type: {account['account_type'].capitalize()}")
                        print(f"Customer: {account.get('customer_name', 'Unknown')}")
                        print(f"Balance: ${account['balance']:.2f}")
                        print(f"Status: {account['status']}")
                        print("-" * 30)
                
                elif subchoice == '2':
                    account_id = input("Enter account ID: ")
                    account = admin.get_account_details(account_id)
                    if account:
                        print("\n--- Account Details ---")
                        print(f"ID: {account['account_id']}")
                        print(f"Type: {account['account_type'].capitalize()}")
                        print(f"Customer: {account.get('customer_name', 'Unknown')}")
                        print(f"Email: {account.get('customer_email', 'Unknown')}")
                        print(f"Balance: ${account['balance']:.2f}")
                        print(f"Status: {account['status']}")
                        print(f"Created: {account['created_at']}")
                        
                        if account['transactions']:
                            print("\nRecent Transactions:")
                            for i, transaction in enumerate(account['transactions'][:5]):
                                print(f"  {i+1}. {transaction['transaction_type'].replace('_', ' ').capitalize()}: ${transaction['amount']:.2f} ({transaction['timestamp']})")
                
                elif subchoice == '3':
                    account_id = input("Enter account ID to freeze: ")
                    admin.freeze_account(account_id)
                
                elif subchoice == '4':
                    account_id = input("Enter account ID to unfreeze: ")
                    admin.unfreeze_account(account_id)
                
                elif subchoice == '5':
                    account_id = input("Enter account ID: ")
                    try:
                        amount = float(input("Adjustment amount (positive for credit, negative for debit): $"))
                        reason = input("Reason for adjustment: ")
                        admin.adjust_account_balance(account_id, amount, reason)
                    except ValueError:
                        print("Invalid amount. Please enter a number.")
                
                elif subchoice == '6':
                    break
                
                else:
                    print("Invalid choice. Please try again.")
        
        elif choice == '3':
            # Transaction Management Submenu
            while True:
                print("\n--- Transaction Management ---")
                print("1. List Recent Transactions")
                print("2. Search Transactions")
                print("3. Back to Main Menu")
                
                subchoice = input("Enter your choice: ")
                
                if subchoice == '1':
                    limit = int(input("Number of transactions to display: ") or "20")
                    transactions = admin.list_all_transactions(limit)
                    print(f"\n--- Recent Transactions ({len(transactions)}) ---")
                    for transaction in transactions:
                        print(f"ID: {transaction['transaction_id']}")
                        print(f"Type: {transaction['transaction_type'].replace('_', ' ').capitalize()}")
                        print(f"Amount: ${transaction['amount']:.2f}")
                        print(f"Account: {transaction.get('account_type', 'Unknown').capitalize()} ({transaction['account_id']})")
                        print(f"Customer: {transaction.get('customer_name', 'Unknown')}")
                        print(f"Time: {transaction['timestamp']}")
                        print(f"Description: {transaction['description']}")
                        print("-" * 30)
                
                elif subchoice == '2':
                    print("\n--- Search Transactions ---")
                    print("Enter search parameters (leave blank to skip):")
                    
                    search_params = {}
                    
                    customer_id = input("Customer ID: ")
                    if customer_id:
                        search_params['customer_id'] = customer_id
                    
                    account_id = input("Account ID: ")
                    if account_id:
                        search_params['account_id'] = account_id
                    
                    transaction_type = input("Transaction Type: ")
                    if transaction_type:
                        search_params['transaction_type'] = transaction_type
                    
                    min_amount = input("Minimum Amount: $")
                    if min_amount:
                        try:
                            search_params['min_amount'] = float(min_amount)
                        except ValueError:
                            print("Invalid amount. Skipping this filter.")
                    
                    max_amount = input("Maximum Amount: $")
                    if max_amount:
                        try:
                            search_params['max_amount'] = float(max_amount)
                        except ValueError:
                            print("Invalid amount. Skipping this filter.")
                    
                    # Note: In a real implementation, we'd also include date range filters
                    
                    transactions = admin.search_transactions(search_params)
                    print(f"\n--- Search Results ({len(transactions)}) ---")
                    for transaction in transactions:
                        print(f"ID: {transaction['transaction_id']}")
                        print(f"Type: {transaction['transaction_type'].replace('_', ' ').capitalize()}")
                        print(f"Amount: ${transaction['amount']:.2f}")
                        print(f"Account: {transaction.get('account_type', 'Unknown').capitalize()} ({transaction['account_id']})")
                        print(f"Customer: {transaction.get('customer_name', 'Unknown')}")
                        print(f"Time: {transaction['timestamp']}")
                        print("-" * 30)
                
                elif subchoice == '3':
                    break
                
                else:
                    print("Invalid choice. Please try again.")
        
        elif choice == '4':
            # System Reports Submenu
            while True:
                print("\n--- System Reports ---")
                print("1. Customer Summary Report")
                print("2. Account Summary Report")
                print("3. Transaction Summary Report")
                print("4. Back to Main Menu")
                
                subchoice = input("Enter your choice: ")
                
                if subchoice == '1':
                    report = admin.generate_system_report('customer_summary')
                    if report:
                        print("\n--- Customer Summary Report ---")
                        print(f"Total Customers: {report['total_customers']}")
                        print(f"Active Customers: {report['active_customers']}")
                        print(f"Inactive Customers: {report['inactive_customers']}")
                        print(f"Generated: {report['generated_at']} by {report['generated_by']}")
                
                elif subchoice == '2':
                    report = admin.generate_system_report('account_summary')
                    if report:
                        print("\n--- Account Summary Report ---")
                        print(f"Total Accounts: {report['total_accounts']}")
                        print(f"Total Balance: ${report['total_balance']:.2f}")
                        print("\nAccounts by Type:")
                        for account_type, data in report['accounts_by_type'].items():
                            print(f"  {account_type.capitalize()}: {data['count']} accounts, ${data['total_balance']:.2f} total")
                        print(f"Generated: {report['generated_at']} by {report['generated_by']}")
                
                elif subchoice == '3':
                    report = admin.generate_system_report('transaction_summary')
                    if report:
                        print("\n--- Transaction Summary Report ---")
                        print(f"Total Transactions: {report['total_transactions']}")
                        print(f"Net Transaction Amount: ${report['net_transaction_amount']:.2f}")
                        print("\nTransactions by Type:")
                        for trans_type, data in report['transactions_by_type'].items():
                            print(f"  {trans_type.replace('_', ' ').capitalize()}: {data['count']} transactions, ${data['total_amount']:.2f} total")
                        print(f"Generated: {report['generated_at']} by {report['generated_by']}")
                
                elif subchoice == '4':
                    break
                
                else:
                    print("Invalid choice. Please try again.")
        
        elif choice == '5':
            # Admin User Management Submenu
            while True:
                print("\n--- Admin User Management ---")
                print("1. Add Admin User")
                print("2. Remove Admin User")
                print("3. Back to Main Menu")
                
                subchoice = input("Enter your choice: ")
                
                if subchoice == '1':
                    email = input("New Admin Email: ")
                    password = getpass.getpass("New Admin Password: ")
                    confirm_password = getpass.getpass("Confirm Password: ")
                    
                    if password != confirm_password:
                        print("Passwords don't match.")
                    else:
                        admin.add_admin_user(email, password)
                
                elif subchoice == '2':
                    email = input("Admin Email to Remove: ")
                    confirm = input(f"Are you sure you want to remove admin {email}? (y/n): ")
                    if confirm.lower() == 'y':
                        admin.remove_admin_user(email)
                
                elif subchoice == '3':
                    break
                
                else:
                    print("Invalid choice. Please try again.")
        
        elif choice == '6':
            admin.admin_logout()
            print("Returning to main menu.")
            break
        
        elif choice == '0':
            admin.admin_logout()
            print("Exiting admin portal.")
            break
        
        else:
            print("Invalid choice. Please try again.")


# Modify the main function to include the admin menu option
def updated_main():
    """Updated main function to include admin functionality."""
    bank = KingstonBank()
    
    while True:
        print("\n--- Kingston Bank ---")
        print("1. Customer Login")
        print("2. Customer Registration")
        print("3. Admin Login")
        print("0. Exit")
        
        choice = input("Enter your choice: ")
        
        if choice == '1':
            email = input("Email: ")
            password = getpass.getpass("Password: ")
            bank.authenticate(email, password)
            
            if bank.logged_in_customer:
                # Customer menu (existing code)
                # ...
                pass
        
        elif choice == '2':
            # Customer registration (existing code)
            # ...
            pass
        
        elif choice == '3':
            admin_menu(bank)
        
        elif choice == '0':
            print("Thank you for using Kingston Bank. Goodbye!")
            break
        
        else:
            print("Invalid choice. Please try again.")


if __name__ == "__main__":
    updated_main()
