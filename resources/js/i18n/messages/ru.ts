/**
 * Источник правды для схемы сообщений: en.ts типизируется по `MessageSchema`,
 * поэтому забытый ключ ловит vue-tsc, а не прод.
 *
 * Правила:
 *   - никакого `as const` — иначе типом ключа станет русский литерал и en.ts
 *     перестанет компилироваться;
 *   - максимум 3 уровня вложенности: vue-i18n разворачивает пути ключей
 *     рекурсивно на уровне типов;
 *   - `@` и `|` зарезервированы vue-i18n (связанные сообщения и плюрализация),
 *     в обычном тексте их быть не должно;
 *   - модуль не импортирует ничего, чтобы не создавать циклов через api/errors.ts.
 */
const ru = {
    common: {
        save: 'Сохранить',
        cancel: 'Отмена',
        edit: 'Изменить',
        delete: 'Удалить',
        apply: 'Применить',
        reset: 'Сбросить',
        close: 'Закрыть',
        retry: 'Повторить',
        refresh: 'Обновить',
        loading: 'Загрузка',
        all: 'Все',
        actions: 'Действия',
        name: 'Название',
        status: 'Статус',
        description: 'Описание',
        email: 'Email',
        phone: 'Телефон',
        phonePlaceholder: '+7 999 123 45 67',
        creator: 'Создатель',
        createdAt: 'Создан',
        noDescription: 'Описание не заполнено.',
        backToHome: 'Вернуться на главную',
    },

    locale: {
        label: 'Язык',
    },

    theme: {
        label: 'Тема',
        light: 'Светлая',
        dark: 'Тёмная',
        system: 'Системная',
    },

    datePicker: {
        open: 'Открыть календарь',
        previousMonth: 'Предыдущий месяц',
        nextMonth: 'Следующий месяц',
        dayMask: 'дд',
        monthMask: 'мм',
        yearMask: 'гггг',
    },

    nav: {
        label: 'Основная навигация',
        menu: 'Меню',
        openMenu: 'Открыть меню',
        dashboard: 'Главная',
        projects: 'Проекты',
        tasks: 'Задачи',
        users: 'Пользователи',
    },

    routes: {
        login: 'Вход',
        register: 'Регистрация',
        dashboard: 'Главная',
        projects: 'Проекты',
        project: 'Проект',
        tasks: 'Задачи',
        task: 'Задача',
        users: 'Пользователи',
        profile: 'Профиль',
        forbidden: 'Доступ запрещён',
        notFound: 'Страница не найдена',
    },

    auth: {
        loginTitle: 'Вход в систему',
        registerTitle: 'Регистрация',
        firstName: 'Имя',
        lastName: 'Фамилия',
        password: 'Пароль',
        currentPassword: 'Текущий пароль',
        passwordConfirmation: 'Подтверждение пароля',
        passwordHint: 'Минимум 8 символов, с буквами и цифрами',
        signIn: 'Войти',
        signUp: 'Зарегистрироваться',
        noAccount: 'Нет аккаунта?',
        haveAccount: 'Уже есть аккаунт?',
        logout: 'Выйти',
        noRole: 'Без роли',
    },

    dashboard: {
        greeting: 'Здравствуйте, {name}',
        projectsCount: 'Проектов',
        tasksCount: 'Задач',
        overdueCount: 'Просрочено',
        myTasksCount: 'Моих задач',
        myTasks: 'Мои задачи',
        allMyTasks: 'Все мои задачи',
        noTasksAssigned: 'Вам пока не назначено ни одной задачи',
        statsStale: 'Цифры обновляются примерно раз в минуту и могут немного отставать от последних изменений.',
    },

    tasks: {
        title: 'Задачи',
        create: 'Создать задачу',
        task: 'Задача',
        project: 'Проект',
        priority: 'Приоритет',
        assignee: 'Исполнитель',
        dueDate: 'Срок',
        author: 'Автор',
        createdAt: 'Создана',
        overdue: 'Просрочена',
        emptyTitle: 'Задач не найдено',
        emptyDescription: 'Измените фильтры или создайте новую задачу.',
        editTitle: 'Изменить задачу',
        newTitle: 'Новая задача',
        deleteTitle: 'Удалить задачу',
        deleteMessage: 'Задача «{title}» будет удалена безвозвратно.',
        created: 'Задача создана.',
        updated: 'Задача обновлена.',
        deleted: 'Задача удалена.',
        dueFrom: 'Срок с',
        dueTo: 'Срок по',
        sort: 'Сортировка',
        direction: 'Направление',
        sortByCreatedAt: 'По дате создания',
        sortByDueDate: 'По сроку',
        directionDesc: 'По убыванию',
        directionAsc: 'По возрастанию',
        projectPlaceholder: 'Выберите проект',
        assigneePlaceholder: 'Выберите исполнителя',
        projectsTruncated: 'Показаны первые 75 проектов.',
        assigneesTruncated: 'Показаны первые 75 пользователей.',
        statusOnlyNotice:
            'Вы можете изменить только статус этой задачи — остальные поля доступны автору и руководителю проекта.',
        board: {
            viewLabel: 'Вид',
            viewBoard: 'Доска',
            viewTable: 'Таблица',
            groupBy: 'Группировка',
            groupByStatus: 'По статусу',
            groupByPriority: 'По приоритету',
            groupByAssignee: 'По исполнителю',
            loadMore: 'Показать ещё',
            quickAdd: 'Добавить задачу',
            quickAddPlaceholder: 'Название задачи',
            columnsTruncated: 'Показаны не все исполнители. Выберите проект, чтобы сузить доску.',
            detailsTitle: 'Детали задачи',
        },
    },

    projects: {
        title: 'Проекты',
        create: 'Создать проект',
        emptyTitle: 'Проектов пока нет',
        emptyDescription: 'Здесь появятся проекты, к которым у вас есть доступ.',
        editTitle: 'Изменить проект',
        newTitle: 'Новый проект',
        deleteTitle: 'Удалить проект',
        deleteMessage: 'Проект «{name}» и все его задачи будут удалены безвозвратно.',
        created: 'Проект создан.',
        updated: 'Проект обновлён.',
        deleted: 'Проект удалён.',
        tasksLink: 'Задачи проекта',
    },

    users: {
        title: 'Пользователи',
        emptyTitle: 'Пользователей не найдено',
        user: 'Пользователь',
        role: 'Роль',
        avatar: 'Аватар',
        avatarHint: 'JPG или PNG, до 2 МБ.',
        avatarPreview: 'Предпросмотр аватара',
        avatarChoose: 'Выбрать файл',
        avatarNoFile: 'Файл не выбран',
        rolesUnavailable: 'Список ролей недоступен.',
        emailPasswordHint: 'Смена email требует подтверждения текущим паролем.',
        rolePlaceholder: 'Без роли',
    },

    profile: {
        changePassword: 'Смена пароля',
        newPassword: 'Новый пароль',
        passwordChanged: 'Пароль изменён.',
        mine: 'Мой профиль',
        other: 'Пользователь',
        saved: 'Данные сохранены.',
    },

    statistics: {
        topUsers: 'Самые активные пользователи',
        noData: 'Пока нет данных',
        tasksCreated: 'Создано задач',
        byStatus: 'Задачи по статусам',
    },

    pagination: {
        label: 'Постраничная навигация',
        range: '{from}–{to} из {total}',
        empty: 'Ничего не найдено',
        previous: 'Назад',
        next: 'Вперёд',
    },

    /** Ответы API. Реальное тело ответа всегда важнее — это запасные тексты. */
    errors: {
        unauthenticated: 'Не авторизован.',
        forbidden: 'Действие запрещено.',
        notFound: 'Запрашиваемый ресурс не найден.',
        validation: 'Проверьте правильность заполнения полей.',
        throttled: 'Слишком много запросов. Попробуйте позже.',
        server: 'Внутренняя ошибка сервера. Попробуйте позже.',
        network: 'Сервер недоступен. Проверьте подключение.',
        unknown: 'Произошла непредвиденная ошибка.',
        checkConnection: 'Проверьте подключение и попробуйте снова.',
        forbiddenTitle: 'Действие запрещено',
        forbiddenText: 'У вашей роли нет доступа к этому разделу. Если это ошибка, обратитесь к администратору.',
        notFoundTitle: 'Страница не найдена',
        notFoundText: 'Проверьте адрес — такой страницы в приложении нет.',
    },

    /** Единственная форма: «с.» — сокращение и не склоняется. */
    throttle: {
        retryIn: 'Слишком много попыток. Повторите через {n} с.',
    },

    /** Клиентские сообщения, зеркалящие правила FormRequest — см. utils/validation.ts. */
    validation: {
        required: 'Заполните это поле.',
        email: 'Введите адрес целиком: имя, знак собаки и домен с точкой.',
        phone: 'Введите номер в международном формате: от {min} до {max} цифр.',
        maxLength: 'Не длиннее {max} символов.',
        minLength: 'Не короче {min} символов.',
        passwordComplexity: 'Пароль должен содержать буквы и цифры.',
        passwordMismatch: 'Пароли не совпадают.',
        avatarImage: 'Аватар должен быть изображением.',
        avatarSize: 'Размер аватара не должен превышать 2 МБ.',
    },

    /**
     * Отражает app/Enums/*.php. Ключи — строковые значения из БД, поэтому
     * неизвестный slug рендерится сам собой (см. useEnumLabel).
     */
    enums: {
        taskStatus: {
            pending: 'Ожидает',
            in_progress: 'В работе',
            completed: 'Завершена',
        },
        taskPriority: {
            low: 'Низкий',
            medium: 'Средний',
            high: 'Высокий',
        },
        projectStatus: {
            active: 'Активен',
            completed: 'Завершён',
            archived: 'В архиве',
        },
        userStatus: {
            active: 'Активен',
            inactive: 'Неактивен',
            blocked: 'Заблокирован',
        },
        role: {
            admin: 'Администратор',
            manager: 'Менеджер',
            user: 'Пользователь',
        },
    },
};

export type MessageSchema = typeof ru;

export default ru;
