package com.zoroacademy.service;

import com.zoroacademy.entity.Expense;
import com.zoroacademy.repository.ExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }


    @Transactional(readOnly = true)
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    @Transactional
    public Expense createExpense(Expense expense) {
        if (expense.getId() == null || expense.getId().isBlank()) {
            expense.setId("exp_" + System.currentTimeMillis());
        }
        return expenseRepository.save(expense);
    }

    @Transactional
    public Expense updateExpense(String id, Expense updated) {
        Expense existing = expenseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found: " + id));
        if (updated.getCategory() != null) existing.setCategory(updated.getCategory());
        if (updated.getAmount() != null) existing.setAmount(updated.getAmount());
        if (updated.getDate() != null) existing.setDate(updated.getDate());
        if (updated.getDescription() != null) existing.setDescription(updated.getDescription());
        if (updated.getReceiptUrl() != null) existing.setReceiptUrl(updated.getReceiptUrl());
        return expenseRepository.save(existing);
    }

    @Transactional
    public void deleteExpense(String id) {
        expenseRepository.deleteById(id);
    }
}
