import DerivedAttribute from "./DerivedAttribute.js";
import { GMM_5E_XP } from "../consts/Gmm5eXp.js";

const MonsterHelpers = (function() {

	function getDerivedAttributes(level, rank, role) {
		const clampedLevel = _getClampedLevel(level);
		const averageProficiencyBonus = _getAverageProficiencyBonus(clampedLevel);
		const averageAbilityModifier = _getAverageAbilityModifier(clampedLevel);
		const averageAbilityModifiers = _getAverageAbilityModifiers(averageAbilityModifier);
		const averageSavingThrows = _getAverageSavingThrows(averageProficiencyBonus, averageAbilityModifier);
		const averagePlayerDamagePerRound = _getAveragePlayerDamagePerRound(clampedLevel, averageProficiencyBonus);
		const averagePlayerHitPoints = _getAveragePlayerHitPoints(clampedLevel, averageAbilityModifier);
		const monsterXp = _getMonsterXp(clampedLevel, rank);

		return {
			level: clampedLevel,
			rank: rank,
			role: role,
			averageProficiencyBonus: averageProficiencyBonus,
			maximumHitPoints: _getMonsterMaximumHitPoints(averagePlayerDamagePerRound, rank, role),
			armorClass: _getMonsterArmorClass(averageProficiencyBonus, averageAbilityModifier, rank, role),
			attackBonus: _getMonsterAttackBonus(averageProficiencyBonus, averageAbilityModifier, rank, role),
			attackDcs: _getMonsterAttackDcs(averageProficiencyBonus, averageAbilityModifier, rank, role),
			damagePerAction: _getMonsterDamagePerAction(averagePlayerHitPoints, rank, role),
			abilityModifiers: _getMonsterAbilityModifiers(averageAbilityModifiers),
			savingThrows: _getMonsterSavingThrows(averageSavingThrows, rank, role),
			xp: monsterXp,
			challengeRating: _getMonsterChallengeRating(monsterXp.value)
		}
	}

	function _getClampedLevel(level) {
		let levels = GMM_5E_XP.map((x) => x.level);
		let max = Math.max(...levels);
		let min = Math.min(...levels);
		return Math.max(min, Math.min(level, max));
	}

	function _getAverageProficiencyBonus(level) {
		return Math.max(1, Math.floor((level + 3) / 4) + 1);
	}

	function _getAverageAbilityModifier(level) {
		return Math.floor(level / 4) + 3;
	}

	function _getAverageAbilityModifiers(abilityModifier) {
		return [
			abilityModifier,
			Math.floor(abilityModifier * 0.75),
			Math.floor(abilityModifier * 0.5),
			Math.floor(abilityModifier * 0.4),
			Math.floor(abilityModifier * 0.3),
			Math.floor((abilityModifier * 0.3) - 1)
		];
	}

	function _getAverageSavingThrows(proficiencyBonus, abilityModifier) {
		return [
			abilityModifier + proficiencyBonus,
			Math.floor((abilityModifier + proficiencyBonus) * 0.66),
			Math.floor((abilityModifier + proficiencyBonus) * 0.66),
			Math.floor(((abilityModifier + proficiencyBonus) * 0.33) - 0.75),
			Math.floor(((abilityModifier + proficiencyBonus) * 0.33) - 0.75),
			Math.floor(((abilityModifier + proficiencyBonus) * 0.33) - 0.75)
		];
	}

	function _getAveragePlayerDamagePerRound(level, proficiencyBonus) {
		return (level > 0) ? Math.max((Math.ceil(level / 4) + (((level - 1) % 4) / 8)) * (4.5 + proficiencyBonus), 1) : 4 + level
	}

	function _getAveragePlayerHitPoints(level, abilityModifier) {
		return (level * (5 + Math.min(abilityModifier - 2, 5))) + 2
	}

	function _getMonsterMaximumHitPoints(playerDamagePerRound, rank, role) {
		const baseHp = playerDamagePerRound * 4;
		const rankHp = rank.modifiers.hit_points;
		const roleHp = role.modifiers.hit_points;

		const hp = new DerivedAttribute();
		hp.add(baseHp, game.i18n.format('gmm.common.derived_source.base'));
		hp.multiply(rankHp, game.i18n.format('gmm.common.derived_source.rank'));
		hp.multiply(roleHp, game.i18n.format('gmm.common.derived_source.role'));

		let scale = 1;
		if (rank.modifiers.scale_with_players && rank.modifiers.target_players != 1) {
			hp.multiply(rank.modifiers.target_players, game.i18n.format('gmm.common.derived_source.scale_with_players'));
		}

		let phases = 1;
		if (rank.modifiers.has_phases && rank.modifiers.phases.maximum != 1) {
			hp.divide(phases, game.i18n.format('gmm.common.derived_source.phases'));
		}

		return hp;
	}

	function _getMonsterArmorClass(proficiencyBonus, abilityModifier, rank, role) {
		const baseAc = ((abilityModifier + proficiencyBonus) * 0.8) + 10;
		const rankAc = rank.modifiers.armor_class;
		const roleAc = role.modifiers.armor_class;

		const ac = new DerivedAttribute();
		ac.add(baseAc, game.i18n.format('gmm.common.derived_source.base'));
		ac.add(rankAc, game.i18n.format('gmm.common.derived_source.rank'));
		ac.add(roleAc, game.i18n.format('gmm.common.derived_source.role'));

		return ac;
	}

	function _getMonsterAttackBonus(proficiencyBonus, abilityModifier, rank, role) {
		const baseAttack = abilityModifier + proficiencyBonus - 2;
		const rankAttack = rank.modifiers.attack_bonus;
		const roleAttack = role.modifiers.attack_bonus;

		const ab = new DerivedAttribute();
		ab.add(baseAttack, game.i18n.format('gmm.common.derived_source.base'));
		ab.add(rankAttack, game.i18n.format('gmm.common.derived_source.rank'));
		ab.add(roleAttack, game.i18n.format('gmm.common.derived_source.role'));
		
		return ab;
	}

	function _getMonsterAttackDcs(proficiencyBonus, abilityModifier, rank, role) {
		const baseDc = (Math.floor(abilityModifier * 0.66)) + proficiencyBonus + 8;
		const rankDc = rank.modifiers.attack_dcs;
		const roleDc = role.modifiers.attack_dcs;
		
		const primary = new DerivedAttribute();
		primary.add(baseDc, game.i18n.format('gmm.common.derived_source.base'));
		primary.add(rankDc, game.i18n.format('gmm.common.derived_source.rank'));
		primary.add(roleDc, game.i18n.format('gmm.common.derived_source.role'));

		const secondary = new DerivedAttribute();
		secondary.add(baseDc - 3, game.i18n.format('gmm.common.derived_source.base'));
		secondary.add(rankDc, game.i18n.format('gmm.common.derived_source.rank'));
		secondary.add(roleDc, game.i18n.format('gmm.common.derived_source.role'));

		return {
			primary: primary,
			secondary: secondary
		};
	}

	function _getMonsterDamagePerAction(averagePlayerHitPoints, rank, role) {
		const baseDamage = averagePlayerHitPoints / 4;
		const roleDamage = role.modifiers.damage_per_action;
		const rankDamage = rank.modifiers.damage_per_action;

		const damage = new DerivedAttribute();
		damage.add(baseDamage, game.i18n.format('gmm.common.derived_source.base'));
		damage.multiply(rankDamage, game.i18n.format('gmm.common.derived_source.rank'));
		damage.multiply(roleDamage, game.i18n.format('gmm.common.derived_source.role'));

		return damage;
	}

	function _getMonsterAbilityModifiers(abilityModifiers) {
		return abilityModifiers.map((x) => {
			const am = new DerivedAttribute();
			am.setValue(x, game.i18n.format('gmm.common.derived_source.base'));
			return am;
		});
	}

	function _getMonsterSavingThrows(savingThrows, rank, role) {
		return savingThrows.map((x) => {
			const st = new DerivedAttribute();
			st.add(x, game.i18n.format('gmm.common.derived_source.base'));
			st.add(rank.modifiers.saving_throws, game.i18n.format('gmm.common.derived_source.rank'));
			st.add(role.modifiers.saving_throws, game.i18n.format('gmm.common.derived_source.role'));
			return st;
		});
	}

	function _getMonsterXp(level, rank) {
		const baseXp = GMM_5E_XP.find((x) => x.level == level).xp;
		const rankXp = rank.modifiers.xp;

		const xp = new DerivedAttribute();
		xp.add(baseXp, game.i18n.format('gmm.common.derived_source.base'));
		xp.multiply(rankXp, game.i18n.format('gmm.common.derived_source.rank'));
		
		return xp;
	}

	function _getMonsterChallengeRating(xp) {
		const baseCr = GMM_5E_XP.filter((x) => x.xp <= xp).pop().cr;

		const cr = new DerivedAttribute();
		cr.setValue(baseCr, game.i18n.format('gmm.common.derived_source.base'));
		
		return cr;
	}

	return {
		getDerivedAttributes: getDerivedAttributes
	};
})();

export default MonsterHelpers;
