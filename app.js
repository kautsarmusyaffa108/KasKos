/* =================================================
   KOSKAS FRONTEND
   HTML + CSS + JavaScript
   ================================================= */


/* =================================================
   CONFIG
   ================================================= */

const API_URL =
  'https://script.google.com/macros/s/AKfycbx26Bb79OdgLc4-pUW-y4hGdBzz7RKTaNZ34lGu8ZntMlzuM0SGBuYAf7r4YFNk1oPNdQ/exec';


/* =================================================
   STATE
   ================================================= */

const state = {

  user: null,

  dashboard: null,

  members: [],

  payments: [],

  expenses: [],

  activities: []

};


/* =================================================
   INIT
   ================================================= */

document.addEventListener(
  'DOMContentLoaded',
  init
);


async function init() {

  try {

    if (
      API_URL.includes(
        'PASTE_URL'
      )
    ) {

      throw new Error(
        'API_URL belum diisi.'
      );

    }


    await loadCurrentUser();

    setupNavigation();

    setupModals();

    setupForms();

    setupFilters();

    applyRolePermissions();

    await loadDashboard();


    hideLoading();

  } catch (error) {

    showFatalError(
      error.message
    );

  }

}


/* =================================================
   API
   ================================================= */

async function apiGet(
  action,
  params = {}
) {

  const query =
    new URLSearchParams({
      action,
      ...params
    });


  const response =
    await fetch(
      `${API_URL}?${query.toString()}`,
      {
        method: 'GET',
        credentials: 'include'
      }
    );


  const data =
    await response.json();


  if (
    !data.success
  ) {

    throw new Error(
      data.error ||
      'Request gagal.'
    );

  }


  return data;

}


async function apiPost(
  action,
  data = {}
) {

  const response =
    await fetch(
      API_URL,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'text/plain;charset=utf-8'
        },

        body:
          JSON.stringify({
            action,
            data
          }),

        credentials:
          'include'
      }
    );


  const result =
    await response.json();


  if (
    !result.success
  ) {

    throw new Error(
      result.error ||
      'Request gagal.'
    );

  }


  return result;

}


/* =================================================
   CURRENT USER
   ================================================= */

async function loadCurrentUser() {

  const result =
    await apiGet(
      'me'
    );


  if (
    !result.authorized
  ) {

    throw new Error(
      result.error ||
      'Akun tidak memiliki akses.'
    );

  }


  state.user =
    result.data;


  renderUser();

}


function renderUser() {

  const user =
    state.user;


  if (!user) {
    return;
  }


  const name =
    user.nama ||
    'User';


  const role =
    user.role ||
    'VIEWER';


  document
    .getElementById(
      'userName'
    )
    .textContent =
      name;


  document
    .getElementById(
      'userRole'
    )
    .textContent =
      role;


  document
    .getElementById(
      'topUserName'
    )
    .textContent =
      name;


  document
    .getElementById(
      'topUserRole'
    )
    .textContent =
      role;


  document
    .getElementById(
      'userAvatar'
    )
    .textContent =
      name
        .charAt(0)
        .toUpperCase();

}


/* =================================================
   ROLE PERMISSION
   ================================================= */

function applyRolePermissions() {

  const role =
    state.user.role;


  /*
   * ADMIN
   */

  if (
    role === 'ADMIN'
  ) {

    document
      .querySelectorAll(
        '.admin-only'
      )
      .forEach(
        element => {

          element.style.display =
            '';

        }
      );

    return;

  }


  /*
   * MEMBER / VIEWER
   */

  document
    .querySelectorAll(
      '.admin-only'
    )
    .forEach(
      element => {

        element.style.display =
          'none';

      }
    );

}


/* =================================================
   NAVIGATION
   ================================================= */

function setupNavigation() {

  document
    .querySelectorAll(
      '.menu-item'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            const page =
              button.dataset.page;


            if (
              !canAccessPage(
                page
              )
            ) {

              showToast(
                'Kamu tidak memiliki akses ke halaman ini.'
              );

              return;

            }


            navigateTo(
              page
            );


            try {

              if (
                page ===
                'dashboard'
              ) {

                await loadDashboard();

              }


              if (
                page ===
                'payments'
              ) {

                await loadPayments();

              }


              if (
                page ===
                'expenses'
              ) {

                await loadExpenses();

              }


              if (
                page ===
                'members'
              ) {

                await loadMembers();

              }


              if (
                page ===
                'activities'
              ) {

                await loadActivities();

              }

            } catch (error) {

              showToast(
                error.message
              );

            }

          }
        );

      }
    );

}


function navigateTo(
  page
) {

  document
    .querySelectorAll(
      '.menu-item'
    )
    .forEach(
      button => {

        button.classList.toggle(
          'active',
          button.dataset.page ===
            page
        );

      }
    );


  document
    .querySelectorAll(
      '.page'
    )
    .forEach(
      section => {

        section.classList.add(
          'hidden'
        );

      }
    );


  const target =
    document.getElementById(
      `page-${page}`
    );


  if (target) {

    target.classList.remove(
      'hidden'
    );

  }


  const titles = {

    dashboard: [
      'Dashboard',
      'Ringkasan keuangan kos'
    ],

    payments: [
      'Iuran',
      'Riwayat pembayaran'
    ],

    expenses: [
      'Pengeluaran',
      'Catatan pengeluaran kos'
    ],

    members: [
      'Penghuni',
      'Kelola penghuni dan role'
    ],

    activities: [
      'Activity Log',
      'Riwayat aktivitas sistem'
    ]

  };


  const info =
    titles[page];


  if (info) {

    document
      .getElementById(
        'pageTitle'
      )
      .textContent =
        info[0];


    document
      .getElementById(
        'pageSubtitle'
      )
      .textContent =
        info[1];

  }

}


function canAccessPage(
  page
) {

  const role =
    state.user.role;


  if (
    page === 'members' ||
    page === 'activities'
  ) {

    return role === 'ADMIN';

  }


  return true;

}


/* =================================================
   DASHBOARD
   ================================================= */

async function loadDashboard() {

  const result =
    await apiGet(
      'dashboard'
    );


  state.dashboard =
    result.data;


  renderDashboard();

}


function renderDashboard() {

  const data =
    state.dashboard;


  if (!data) {
    return;
  }


  document
    .getElementById(
      'totalIncome'
    )
    .textContent =
      formatRupiah(
        data.summary.totalIncome
      );


  document
    .getElementById(
      'totalExpense'
    )
    .textContent =
      formatRupiah(
        data.summary.totalExpense
      );


  document
    .getElementById(
      'balance'
    )
    .textContent =
      formatRupiah(
        data.summary.balance
      );


  document
    .getElementById(
      'paymentProgress'
    )
    .textContent =
      `${data.monthlyPayment.paid} / ${data.monthlyPayment.total}`;


  document
    .getElementById(
      'currentMonth'
    )
    .textContent =
      formatMonth(
        data.month
      );


  renderPaymentStatus(
    data.monthlyPayment.items
  );


  renderCategories(
    data.categoryBreakdown
  );


  renderActivities(
    data.recentActivities,
    'recentActivities'
  );

}


/* =================================================
   PAYMENT STATUS
   ================================================= */

function renderPaymentStatus(
  items
) {

  const container =
    document.getElementById(
      'paymentStatusList'
    );


  if (
    !items ||
    !items.length
  ) {

    container.innerHTML =
      '<p class="empty">Belum ada data.</p>';

    return;

  }


  container.innerHTML =
    items
      .map(
        item => {

          const paid =
            item.status ===
            'Lunas';


          return `

            <div class="payment-status-item">

              <div class="payment-person">

                <span
                  class="status-dot ${paid ? 'paid' : ''}"
                ></span>

                <span class="status-text">
                  ${escapeHtml(item.nama)}
                </span>

              </div>

              <span
                class="status-label ${paid ? 'paid' : 'unpaid'}"
              >
                ${paid ? 'Lunas' : 'Belum'}
              </span>

            </div>

          `;

        }
      )
      .join('');

}


/* =================================================
   CATEGORIES
   ================================================= */

function renderCategories(
  categories
) {

  const container =
    document.getElementById(
      'categoryList'
    );


  const values =
    Object.entries(
      categories || {}
    );


  const max =
    Math.max(
      ...values.map(
        item =>
          Number(item[1])
      ),
      1
    );


  container.innerHTML =
    values
      .map(
        ([name, value]) => {

          const percent =
            (
              Number(value) /
              max
            ) * 100;


          return `

            <div class="category-item">

              <div class="category-top">

                <span>
                  ${escapeHtml(name)}
                </span>

                <strong>
                  ${formatRupiah(value)}
                </strong>

              </div>

              <div class="category-bar">

                <div
                  class="category-fill"
                  style="width:${percent}%"
                ></div>

              </div>

            </div>

          `;

        }
      )
      .join('');

}


/* =================================================
   PAYMENTS
   ================================================= */

async function loadPayments() {

  const params = {};


  const month =
    document
      .getElementById(
        'paymentMonth'
      )
      .value;


  const status =
    document
      .getElementById(
        'paymentStatusFilter'
      )
      .value;


  if (month) {
    params.month = month;
  }


  if (status) {
    params.status = status;
  }


  const result =
    await apiGet(
      'payments',
      params
    );


  state.payments =
    result.data;


  renderPayments();

}


function renderPayments() {

  const tbody =
    document.getElementById(
      'paymentTable'
    );


  if (
    !state.payments.length
  ) {

    tbody.innerHTML = `
      <tr>
        <td colspan="7">
          Belum ada data pembayaran.
        </td>
      </tr>
    `;

    return;

  }


  tbody.innerHTML =
    state.payments
      .map(
        payment => {

          const canUpdate =
            state.user.role ===
            'ADMIN';


          return `

            <tr>

              <td>
                ${payment.tanggal}
              </td>

              <td>
                ${escapeHtml(payment.penghuni)}
              </td>

              <td>
                ${payment.bulan}
              </td>

              <td>
                ${formatRupiah(payment.nominal)}
              </td>

              <td>
                ${escapeHtml(payment.metode)}
              </td>

              <td>
                <span
                  class="status-badge status-${payment.status.toLowerCase()}"
                >
                  ${payment.status}
                </span>
              </td>

              <td>

                ${
                  canUpdate
                    ? renderPaymentActions(
                        payment
                      )
                    : '-'
                }

              </td>

            </tr>

          `;

        }
      )
      .join('');

}


function renderPaymentActions(
  payment
) {

  if (
    payment.status ===
    'Pending'
  ) {

    return `

      <button
        class="btn btn-small btn-primary"
        onclick="changePaymentStatus('${payment.id}', 'Lunas')"
      >
        Terima
      </button>

      <button
        class="btn btn-small btn-danger"
        onclick="changePaymentStatus('${payment.id}', 'Rejected')"
      >
        Tolak
      </button>

    `;

  }


  return '-';

}


async function changePaymentStatus(
  id,
  status
) {

  if (
    state.user.role !==
    'ADMIN'
  ) {

    return;

  }


  try {

    await apiPost(
      'updatePaymentStatus',
      {
        id,
        status
      }
    );


    showToast(
      'Status pembayaran diperbarui.'
    );


    await loadPayments();

    await loadDashboard();

  } catch (error) {

    showToast(
      error.message
    );

  }

}


/* =================================================
   EXPENSES
   ================================================= */

async function loadExpenses() {

  const params = {};


  const month =
    document
      .getElementById(
        'expenseMonth'
      )
      .value;


  const category =
    document
      .getElementById(
        'expenseCategoryFilter'
      )
      .value;


  const search =
    document
      .getElementById(
        'expenseSearch'
      )
      .value;


  if (month) {
    params.month = month;
  }


  if (category) {
    params.category = category;
  }


  if (search) {
    params.search = search;
  }


  const result =
    await apiGet(
      'expenses',
      params
    );


  state.expenses =
    result.data;


  renderExpenses();

}


function renderExpenses() {

  const tbody =
    document.getElementById(
      'expenseTable'
    );


  if (
    !state.expenses.length
  ) {

    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          Belum ada data pengeluaran.
        </td>
      </tr>
    `;

    return;

  }


  tbody.innerHTML =
    state.expenses
      .map(
        expense => `

          <tr>

            <td>
              ${expense.tanggal}
            </td>

            <td>
              ${escapeHtml(expense.kategori)}
            </td>

            <td>
              ${escapeHtml(expense.deskripsi)}
            </td>

            <td>
              ${formatRupiah(expense.nominal)}
            </td>

            <td>
              ${escapeHtml(expense.oleh)}
            </td>

            <td>

              <span
                class="status-badge status-${expense.status.toLowerCase()}"
              >
                ${expense.status}
              </span>

            </td>

          </tr>

        `
      )
      .join('');

}


/* =================================================
   MEMBERS
   ================================================= */

async function loadMembers() {

  if (
    state.user.role !==
    'ADMIN'
  ) {

    return;

  }


  const result =
    await apiGet(
      'members'
    );


  state.members =
    result.data;


  renderMembers();


  populateMemberSelect();

}


function renderMembers() {

  const tbody =
    document.getElementById(
      'memberTable'
    );


  tbody.innerHTML =
    state.members
      .map(
        member => `

          <tr>

            <td>
              ${escapeHtml(member.nama)}
            </td>

            <td>
              ${escapeHtml(member.email)}
            </td>

            <td>

              <span
                class="status-badge status-${member.status.toLowerCase()}"
              >
                ${member.status}
              </span>

            </td>

            <td>

              <select
                onchange="
                  changeMemberRole(
                    '${member.id}',
                    this.value
                  )
                "
              >

                ${renderRoleOptions(
                  member.role
                )}

              </select>

            </td>

            <td>

              <select
                onchange="
                  changeMemberStatus(
                    '${member.id}',
                    this.value
                  )
                "
              >

                <option
                  value="ACTIVE"
                  ${member.status === 'ACTIVE' ? 'selected' : ''}
                >
                  ACTIVE
                </option>

                <option
                  value="INACTIVE"
                  ${member.status === 'INACTIVE' ? 'selected' : ''}
                >
                  INACTIVE
                </option>

              </select>

            </td>

          </tr>

        `
      )
      .join('');

}


function renderRoleOptions(
  currentRole
) {

  return [
    'ADMIN',
    'MEMBER',
    'VIEWER'
  ]
    .map(
      role => `

        <option
          value="${role}"
          ${currentRole === role ? 'selected' : ''}
        >
          ${role}
        </option>

      `
    )
    .join('');

}


async function changeMemberRole(
  id,
  role
) {

  try {

    await apiPost(
      'updateMemberRole',
      {
        id,
        role
      }
    );


    showToast(
      'Role berhasil diubah.'
    );


    await loadMembers();

  } catch (error) {

    showToast(
      error.message
    );

    await loadMembers();

  }

}


async function changeMemberStatus(
  id,
  status
) {

  try {

    await apiPost(
      'updateMemberStatus',
      {
        id,
        status
      }
    );


    showToast(
      'Status penghuni berhasil diubah.'
    );


    await loadMembers();

  } catch (error) {

    showToast(
      error.message
    );

    await loadMembers();

  }

}


/* =================================================
   ACTIVITIES
   ================================================= */

async function loadActivities() {

  if (
    state.user.role !==
    'ADMIN'
  ) {

    return;

  }


  const result =
    await apiGet(
      'activities',
      {
        limit: 100
      }
    );


  state.activities =
    result.data;


  renderActivities(
    state.activities,
    'activityPageList'
  );

}


function renderActivities(
  activities,
  containerId
) {

  const container =
    document.getElementById(
      containerId
    );


  if (
    !activities ||
    !activities.length
  ) {

    container.innerHTML =
      '<p class="empty">Belum ada aktivitas.</p>';

    return;

  }


  container.innerHTML =
    activities
      .map(
        activity => `

          <div class="activity-item">

            <strong>
              ${escapeHtml(activity.type)}
            </strong>

            <p>
              ${escapeHtml(activity.description)}
            </p>

            <small>
              ${activity.timestamp}

              ${
                Number(activity.nominal) > 0
                  ? ` · ${formatRupiah(activity.nominal)}`
                  : ''
              }

            </small>

          </div>

        `
      )
      .join('');

}


/* =================================================
   MODALS
   ================================================= */

function setupModals() {

  document
    .querySelectorAll(
      '[data-close]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            closeModal(
              button.dataset.close
            );

          }
        );

      }
    );


  document
    .getElementById(
      'btnAddPayment'
    )
    .addEventListener(
      'click',
      async () => {

        if (
          state.user.role ===
          'VIEWER'
        ) {

          showToast(
            'VIEWER tidak dapat menambahkan iuran.'
          );

          return;

        }


        await preparePaymentModal();

        openModal(
          'paymentModal'
        );

      }
    );


  document
    .getElementById(
      'btnAddExpense'
    )
    .addEventListener(
      'click',
      () => {

        if (
          state.user.role ===
          'VIEWER'
        ) {

          showToast(
            'VIEWER tidak dapat menambahkan pengeluaran.'
          );

          return;

        }


        openModal(
          'expenseModal'
        );

      }
    );

}


function openModal(
  id
) {

  document
    .getElementById(
      id
    )
    .classList.remove(
      'hidden'
    );

}


function closeModal(
  id
) {

  document
    .getElementById(
      id
    )
    .classList.add(
      'hidden'
    );

}


/* =================================================
   PAYMENT MODAL
   ================================================= */

async function preparePaymentModal() {

  const select =
    document.getElementById(
      'paymentMember'
    );


  /*
   * MEMBER tidak perlu
   * memilih dirinya sendiri.
   */

  if (
    state.user.role ===
    'MEMBER'
  ) {

    select.innerHTML = `

      <option
        value="${state.user.id}"
      >
        ${escapeHtml(state.user.nama)}
      </option>

    `;

    select.disabled = true;

  } else {

    await loadMembers();


    select.disabled = false;


    select.innerHTML =
      state.members
        .filter(
          member =>
            member.status ===
            'ACTIVE'
        )
        .map(
          member => `

            <option
              value="${member.id}"
            >
              ${escapeHtml(member.nama)}
            </option>

          `
        )
        .join('');

  }


  const today =
    new Date()
      .toISOString()
      .split('T')[0];


  document
    .getElementById(
      'paymentDate'
    )
    .value =
      today;

}


/* =================================================
   FORMS
   ================================================= */

function setupForms() {

  document
    .getElementById(
      'paymentForm'
    )
    .addEventListener(
      'submit',
      submitPayment
    );


  document
    .getElementById(
      'expenseForm'
    )
    .addEventListener(
      'submit',
      submitExpense
    );

}


async function submitPayment(
  event
) {

  event.preventDefault();


  try {

    const data = {

      penghuniId:
        document
          .getElementById(
            'paymentMember'
          )
          .value,

      tanggal:
        document
          .getElementById(
            'paymentDate'
          )
          .value,

      nominal:
        Number(
          document
            .getElementById(
              'paymentNominal'
            )
            .value
        ),

      metode:
        document
          .getElementById(
            'paymentMethod'
          )
          .value,

      bukti:
        document
          .getElementById(
            'paymentProof'
          )
          .value

    };


    await apiPost(
      'addPayment',
      data
    );


    closeModal(
      'paymentModal'
    );


    document
      .getElementById(
        'paymentForm'
      )
      .reset();


    showToast(
      'Iuran berhasil dicatat.'
    );


    await loadPayments();

    await loadDashboard();

  } catch (error) {

    showToast(
      error.message
    );

  }

}


async function submitExpense(
  event
) {

  event.preventDefault();


  try {

    const data = {

      /*
       * Backend MEMBER otomatis
       * mengganti olehId menjadi
       * user sendiri.
       */

      olehId:
        state.user.id,

      kategori:
        document
          .getElementById(
            'expenseCategory'
          )
          .value,

      deskripsi:
        document
          .getElementById(
            'expenseDescription'
          )
          .value,

      nominal:
        Number(
          document
            .getElementById(
              'expenseNominal'
            )
            .value
        ),

      nota:
        document
          .getElementById(
            'expenseReceipt'
          )
          .value

    };


    await apiPost(
      'addExpense',
      data
    );


    closeModal(
      'expenseModal'
    );


    document
      .getElementById(
        'expenseForm'
      )
      .reset();


    showToast(
      'Pengeluaran berhasil dicatat.'
    );


    await loadExpenses();

    await loadDashboard();

  } catch (error) {

    showToast(
      error.message
    );

  }

}


/* =================================================
   FILTER
   ================================================= */

function setupFilters() {

  document
    .getElementById(
      'paymentMonth'
    )
    .addEventListener(
      'change',
      loadPayments
    );


  document
    .getElementById(
      'paymentStatusFilter'
    )
    .addEventListener(
      'change',
      loadPayments
    );


  document
    .getElementById(
      'expenseMonth'
    )
    .addEventListener(
      'change',
      loadExpenses
    );


  document
    .getElementById(
      'expenseCategoryFilter'
    )
    .addEventListener(
      'change',
      loadExpenses
    );


  let searchTimer;


  document
    .getElementById(
      'expenseSearch'
    )
    .addEventListener(
      'input',
      () => {

        clearTimeout(
          searchTimer
        );


        searchTimer =
          setTimeout(
            loadExpenses,
            350
          );

      }
    );

}


/* =================================================
   MEMBER SELECT
   ================================================= */

function populateMemberSelect() {

  const select =
    document.getElementById(
      'paymentMember'
    );


  if (
    !select ||
    state.user.role ===
      'MEMBER'
  ) {

    return;

  }


  select.innerHTML =
    state.members
      .filter(
        member =>
          member.status ===
          'ACTIVE'
      )
      .map(
        member => `

          <option
            value="${member.id}"
          >
            ${escapeHtml(member.nama)}
          </option>

        `
      )
      .join('');

}


/* =================================================
   UI HELPERS
   ================================================= */

function formatRupiah(
  value
) {

  return new Intl.NumberFormat(
    'id-ID',
    {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }
  )
    .format(
      Number(value || 0)
    );

}


function formatMonth(
  value
) {

  if (
    !value ||
    !value.includes('-')
  ) {

    return value || '-';

  }


  const [
    year,
    month
  ] =
    value.split('-');


  const date =
    new Date(
      Number(year),
      Number(month) - 1,
      1
    );


  return date.toLocaleDateString(
    'id-ID',
    {
      month: 'long',
      year: 'numeric'
    }
  );

}


function escapeHtml(
  value
) {

  return String(
    value ?? ''
  )
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    )
    .replace(
      /'/g,
      '&#039;'
    );

}


/* =================================================
   TOAST
   ================================================= */

let toastTimer;


function showToast(
  message
) {

  const toast =
    document.getElementById(
      'toast'
    );


  toast.textContent =
    message;


  toast.classList.remove(
    'hidden'
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        toast.classList.add(
          'hidden'
        );

      },
      3000
    );

}


/* =================================================
   LOADING
   ================================================= */

function hideLoading() {

  document
    .getElementById(
      'loadingScreen'
    )
    .classList.add(
      'hidden'
    );


  document
    .getElementById(
      'app'
    )
    .classList.remove(
      'hidden'
    );

}


/* =================================================
   FATAL ERROR
   ================================================= */

function showFatalError(
  message
) {

  const loading =
    document.getElementById(
      'loadingScreen'
    );


  loading.innerHTML = `

    <div class="loading-box">

      <h2>
        Akses KOSKAS gagal
      </h2>

      <p>
        ${escapeHtml(message)}
      </p>

      <button
        class="btn btn-primary"
        style="margin-top:15px"
        onclick="location.reload()"
      >
        Coba Lagi
      </button>

    </div>

  `;

}


/* =================================================
   GLOBAL EXPORT
   ================================================= */

window.changePaymentStatus =
  changePaymentStatus;

window.changeMemberRole =
  changeMemberRole;

window.changeMemberStatus =
  changeMemberStatus;